import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { bakeVideo } from '@/services/bake';
import {
  auth,
  db,
  collection,
  onSnapshot,
  query,
  orderBy,
  storageDb,
  storageRef,
  doc,
  updateDoc,
  deleteDoc,
  deleteObject,
  getDownloadURL,
} from '@/services/FirebaseConfig';
import type { Position } from '@/features/tracking/types';
import LibraryCard, { LibraryCardSkeleton } from '@/components/LibraryCard';
import LibraryDetailModal from '@/components/LibraryDetailModal';
import EmptyState from '@/components/ui/EmptyState';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl';
import { layout, spacing } from '@/styles/theme';

interface VideoItem {
  id: string;
  videoBlobPath: string; // original video in Storage
  url: string; // download URL for the original video
  thumbnailUrl: string;
  liftName: string;
  path: Position[]; // normalized bar path, rendered as a live overlay
  fps: number; // sampling fps + frame count drive on-device baking
  frameCount: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

type SortKey = 'recent' | 'name';

const SORT_OPTIONS: readonly SegmentedOption<SortKey>[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'Name' },
];
const TAB_EDGES = ['top'] as const;
const COLUMNS = 2;
const GUTTER = spacing.sm;
const SKELETON_IDS = ['skeleton-0', 'skeleton-1', 'skeleton-2', 'skeleton-3'];
const PHOTOS_ALBUM = 'BarbellTracker';
const DEFAULT_FPS = 10;

function formatDate(timestamp?: FirebaseFirestoreTypes.Timestamp): string {
  try {
    const date = timestamp?.toDate?.() ?? new Date();
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function liftCountLabel(count: number): string {
  return count === 1 ? '1 lift' : `${count} lifts`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

export default function LibraryScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { width: windowWidth } = useWindowDimensions();
  const user = auth.currentUser;

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');

  // Tiles are sized from the live window width, so rotation and tablets get a correct grid
  const cardWidth = (windowWidth - layout.screenPadding * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;
  const bottomInset = useMemo(() => ({ paddingBottom: tabBarHeight + spacing.lg }), [tabBarHeight]);

  const sortedVideos = useMemo(() => {
    const items = [...videos];
    if (sort === 'name') {
      return items.sort((a, b) => (a.liftName || '').localeCompare(b.liftName || ''));
    }
    return items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  }, [videos, sort]);

  // Firestore subscription

  useEffect(() => {
    if (!user) {
      setVideos([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    const videosQuery = query(collection(db, 'users', user.uid, 'videos'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      videosQuery,
      async (snapshot) => {
        const results = await Promise.allSettled<VideoItem>(
          snapshot.docs.map(async (videoDoc) => {
            const data = videoDoc.data();
            const videoBlobPath = String(data.videoBlobPath || '');

            if (!videoBlobPath.startsWith(`${user.uid}/`)) {
              throw new Error(`unauthorized path: ${videoBlobPath}`);
            }

            const url = await getDownloadURL(storageRef(storageDb, videoBlobPath));

            return {
              id: videoDoc.id,
              videoBlobPath,
              url,
              thumbnailUrl: data.thumbnailUrl ?? '',
              liftName: data.liftName ?? 'Untitled',
              path: Array.isArray(data.path) ? (data.path as Position[]) : [],
              fps: Number(data.fps) || DEFAULT_FPS,
              frameCount: Number(data.frameCount) || 0,
              createdAt: data.createdAt,
            } as VideoItem;
          }),
        );

        const items: VideoItem[] = [];
        let hadErrors = false;

        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            items.push(result.value);
          } else {
            hadErrors = true;
            console.warn('getDownloadURL failed', snapshot.docs[i].id, result.reason);
          }
        });

        setVideos(items);
        setLoading(false);

        if (hadErrors && items.length === 0) {
          Alert.alert('Some videos couldn’t be loaded', 'Please try again later.');
        }
      },
      (error: { code?: string; message: string }) => {
        const signedOut = !auth.currentUser;
        if (signedOut && error?.code === 'permission-denied') return;
        console.error(error);
        setLoading(false);
        Alert.alert('Error', error.message);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // action functions

  async function handleDelete(item: VideoItem, confirmed = false) {
    if (!confirmed) {
      return Alert.alert(
        'Delete video?',
        `This will permanently delete “${item.liftName || 'this video'}”.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item, true) },
        ],
        { cancelable: true },
      );
    }

    setBusy(true);
    try {
      if (!user) throw new Error('User not authenticated');

      // delete the MP4
      await deleteObject(storageRef(storageDb, item.videoBlobPath)).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });

      // delete the thumbnail
      await deleteObject(storageRef(storageDb, `${user.uid}/thumbs/${item.id}.jpg`)).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });

      // delete Firestore doc
      await deleteDoc(doc(db, 'users', user.uid, 'videos', item.id));

      Alert.alert('Deleted', 'Video removed from your library.');
    } catch (error: unknown) {
      Alert.alert('Delete failed', errorMessage(error));
    } finally {
      setBusy(false);
      setSelected(null);
    }
  }

  // Save to camera roll: bake the bar path into a real MP4 first
  async function handleSave(item: VideoItem) {
    setBusy(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Photo library permission not granted');

      const localUri = await bakeVideo({
        videoId: item.id,
        sourceUrl: item.url,
        positions: item.path,
        fps: item.fps,
        frameCount: item.frameCount,
      });

      const asset = await MediaLibrary.createAssetAsync(localUri);
      const album = await MediaLibrary.getAlbumAsync(PHOTOS_ALBUM);
      if (album == null) {
        await MediaLibrary.createAlbumAsync(PHOTOS_ALBUM, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Saved', 'Video with bar path saved to your camera roll.');
    } catch (error: unknown) {
      Alert.alert('Save failed', errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function openRename(item: VideoItem) {
    if (Platform.OS !== 'ios') {
      Alert.alert('Rename', 'Renaming is not available on Android yet.');
      return;
    }
    Alert.prompt(
      'Rename Video',
      'Enter a new name for your video',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newName?: string) => {
            if (typeof newName !== 'string' || !newName.trim()) return;
            try {
              if (!user) throw new Error('User not authenticated');
              await updateDoc(doc(db, 'users', user.uid, 'videos', item.id), { liftName: newName });

              setVideos((current) => current.map((v) => (v.id === item.id ? { ...v, liftName: newName } : v)));
              setSelected(null);
            } catch (error: unknown) {
              Alert.alert('Rename failed', errorMessage(error));
            }
          },
        },
      ],
      'plain-text',
      item.liftName,
    );
  }

  function openActions(item: VideoItem) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: item.liftName || 'Video',
          options: ['Cancel', 'Rename', 'Save to Photos', 'Delete'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'dark',
        },
        (index) => {
          if (index === 1) openRename(item);
          if (index === 2) handleSave(item);
          if (index === 3) handleDelete(item);
        },
      );
    } else {
      Alert.alert(item.liftName || 'Video', '', [
        { text: 'Rename', onPress: () => openRename(item) },
        { text: 'Save to Photos', onPress: () => handleSave(item) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  // render

  const renderItem = ({ item }: { item: VideoItem }) => (
    <LibraryCard
      title={item.liftName || 'Untitled'}
      subtitle={formatDate(item.createdAt)}
      thumbnailUrl={item.thumbnailUrl}
      width={cardWidth}
      onPress={() => setSelected(item)}
      onMenuPress={() => openActions(item)}
    />
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.skeletonGrid}>
          {SKELETON_IDS.map((id) => (
            <LibraryCardSkeleton key={id} width={cardWidth} />
          ))}
        </View>
      );
    }

    if (videos.length === 0) {
      return (
        <EmptyState
          icon="film-outline"
          title="No lifts yet"
          message="Track a lift and it will show up here with its bar path."
          actionLabel="Track a lift"
          onAction={() => router.push('/')}
        />
      );
    }

    return (
      <FlatList
        data={sortedVideos}
        keyExtractor={(video) => video.id}
        renderItem={renderItem}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.grid, bottomInset]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={5}
      />
    );
  };

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.container}>
        <ScreenHeader
          title="Library"
          subtitle={loading ? 'Loading your lifts…' : liftCountLabel(videos.length)}
          right={
            videos.length > 1 ? (
              <SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} accessibilityLabel="Sort lifts" />
            ) : undefined
          }
          style={styles.header}
        />

        {renderContent()}

        {selected ? (
          <LibraryDetailModal
            visible
            item={{
              url: selected.url,
              liftName: selected.liftName,
              path: selected.path,
              subtitle: formatDate(selected.createdAt),
            }}
            busy={busy}
            onClose={() => setSelected(null)}
            onSave={() => handleSave(selected)}
            onDelete={() => handleDelete(selected)}
            onRename={() => openRename(selected)}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  grid: {
    gap: GUTTER,
  },
  gridRow: {
    gap: GUTTER,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GUTTER,
  },
});
