import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Dimensions, Image, ActivityIndicator, Platform, Pressable, ActionSheetIOS, } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { bakeVideo } from '../../services/bake';
import { auth, db, collection, onSnapshot, query, orderBy, storageDb, storageRef, doc, deleteDoc, deleteObject, getDownloadURL, } from '../../services/FirebaseConfig';
import { QueryDocumentSnapshot } from '@firebase/firestore-types';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import { Feather } from '@expo/vector-icons';
import PreviewModal from '../components/PreviewModal';
import type { Position } from '../../features/tracking/types';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii } from '../styles/theme';

interface VideoItem {
  id: string;
  videoBlobPath: string;      // original video in Storage
  url: string;                // download URL for the original video
  thumbnailUrl: string;
  liftName: string;
  path: Position[];           // normalized bar path, rendered as a live overlay
  fps: number;                // sampling fps + frame count drive on-device baking
  frameCount: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GUTTER = 16;
const THUMB_SIZE = (width - (HORIZONTAL_PADDING * 2) - GUTTER) / 2;

export default function LibraryScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [busy, setBusy] = useState(false);

  // UI helpers
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    // small UX pause
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 450));
    setRefreshing(false);
  }, []);

  const sortedVideos = useMemo(() => {
    const arr = [...videos];
    if (sort === 'name') {
      return arr.sort((a, b) => (a.liftName || '').localeCompare(b.liftName || ''));
    }
    return arr.sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
    );
  }, [videos, sort]);

  // Firestore subscription

  useEffect(() => {
    if (!user) {
      setVideos([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    const videosQuery = query(
      collection(db, 'users', user.uid, 'videos'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      videosQuery,
      async (snapshot) => {
        setLoading((prev) => prev && videos.length === 0);

        const results = await Promise.allSettled<VideoItem>(
          snapshot.docs.map(async (doc: QueryDocumentSnapshot<any>) => {
            const data = doc.data();
            const videoBlobPath = String(data.videoBlobPath || '');

            if (!videoBlobPath.startsWith(`${user.uid}/`)) {
              throw new Error(`unauthorized path: ${videoBlobPath}`);
            }

            const url = await getDownloadURL(storageRef(storageDb, videoBlobPath));

            return {
              id: doc.id,
              videoBlobPath,
              url,
              thumbnailUrl: data.thumbnailUrl ?? '',
              liftName: data.liftName ?? 'Untitled',
              path: Array.isArray(data.path) ? (data.path as Position[]) : [],
              fps: Number(data.fps) || 10,
              frameCount: Number(data.frameCount) || 0,
              createdAt: data.createdAt,
            } as VideoItem;
          })
        );

        const items: VideoItem[] = [];
        let hadErrors = false;

        results.forEach((r, i) => {
          if (r.status === 'fulfilled') items.push(r.value);
          else {
            hadErrors = true;
            const badDoc = snapshot.docs[i];
            console.warn(
              'getDownloadURL failed',
              badDoc.id,
              badDoc.data()?.blobPath,
              r.reason
            );
          }
        });

        setVideos(items);
        setLoading(false);

        if (hadErrors && items.length === 0) {
          Alert.alert('Some videos couldn’t be loaded', 'Please try again later.');
        }
      },
      (error: any) => {
        const signedOut = !auth.currentUser;
        if (signedOut && error?.code === 'permission-denied') return;
        console.error(error);
        setLoading(false);
        Alert.alert('Error', error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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
        { cancelable: true }
      );
    }

    setBusy(true);
    try {
      if (!user) throw new Error('User not authenticated');

      // delete the MP4
      const vidRef = storageRef(storageDb, item.videoBlobPath);
      await deleteObject(vidRef).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });

      // delete the thumbnail
      const thumbRef = storageRef(storageDb, `${user.uid}/thumbs/${item.id}.jpg`);
      await deleteObject(thumbRef).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });

      // delete Firestore doc
      const docRef = doc(db, 'users', user.uid, 'videos', item.id);
      await deleteDoc(docRef);

      Alert.alert('Deleted', 'Video removed from your library.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
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
      const album = await MediaLibrary.getAlbumAsync('BarbellTracker');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('BarbellTracker', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Saved', 'Video with bar path saved to your camera roll!');
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  function openRename(item: VideoItem) {
    if (Platform.OS === 'ios') {
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
                await firestore()
                  .collection('users')
                  .doc(user.uid)
                  .collection('videos')
                  .doc(item.id)
                  .update({ liftName: newName });

                setVideos((vs) =>
                  vs.map((v) => (v.id === item.id ? { ...v, liftName: newName } : v))
                );
                setSelected(null);
              } catch (e: any) {
                Alert.alert('Rename failed', e.message);
              }
            },
          },
        ],
        'plain-text',
        item.liftName
      );
    }
  }

  function openActions(item: VideoItem) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Rename', 'Save to Photos', 'Delete'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'dark',
        },
        (i) => {
          if (i === 1) openRename(item);
          if (i === 2) handleSave(item);
          if (i === 3) handleDelete(item);
        }
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

  function formatDate(ts?: FirebaseFirestoreTypes.Timestamp) {
    try {
      const d = ts?.toDate?.() ?? new Date();
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  // render

  const renderThumb = ({ item }: { item: VideoItem }) => (
    <Pressable
      style={styles.card}
      onPress={() => setSelected(item)}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />

      {/* kebab menu */}
      <Pressable style={styles.kebab} hitSlop={10} onPress={() => openActions(item)}>
        <Feather name="more-vertical" size={18} color="#fff" />
      </Pressable>

      {/* bottom overlay */}
      <View style={styles.overlay}>
        <Text numberOfLines={1} style={styles.name}>
          {item.liftName || 'Untitled'}
        </Text>
        <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
      </View>
    </Pressable>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Typography variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            Fetching your recent lifts…
          </Typography>
        </View>
      );
    }

    if (videos.length === 0) {
      return (
        <View style={styles.center}>
          <Card tone="secondary" style={styles.emptyCard}>
            <Pill label="Library" tone="accent" />
            <Typography variant="title" weight="black">
              No saved videos yet
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.emptyCopy}>
              Upload a lift to analyze it with AI overlays and see it saved here for review.
            </Typography>
            <Pressable
              onPress={() => router.push('/upload')}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            >
              <Typography variant="subtitle" weight="bold" color={colors.background}>
                Upload a lift
              </Typography>
            </Pressable>
          </Card>
        </View>
      );
    }

    return (
      <FlatList
        data={sortedVideos}
        keyExtractor={(v) => v.id}
        renderItem={renderThumb}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={7}
      />
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pill label="Library" tone="accent" uppercase />
          <Typography variant="hero" weight="black" style={styles.title}>
            Your analyzed lifts
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Sort and revisit saved sets, export clips, and keep your training archive organized.
          </Typography>
          <View style={styles.sortChips}>
            <Pressable
              onPress={() => setSort('recent')}
              style={[styles.chip, sort === 'recent' && styles.chipActive]}
            >
              <Typography variant="caption" color={sort === 'recent' ? colors.background : colors.textMuted} weight="bold">
                Recent
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => setSort('name')}
              style={[styles.chip, sort === 'name' && styles.chipActive]}
            >
              <Typography variant="caption" color={sort === 'name' ? colors.background : colors.textMuted} weight="bold">
                Name
              </Typography>
            </Pressable>
          </View>
        </View>

        {renderContent()}

        {selected && (
          <PreviewModal
            visible
            item={selected}
            busy={busy}
            onClose={() => setSelected(null)}
            onSave={() => handleSave(selected)}
            onDelete={() => handleDelete(selected)}
            onRename={() => openRename(selected)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    lineHeight: 22,
  },
  sortChips: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyCopy: {
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  ctaPressed: {
    transform: [{ scale: 0.97 }],
  },
  listContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GUTTER,
  },
  card: {
    width: THUMB_SIZE,
    marginBottom: 0,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * (16 / 9),
  },
  kebab: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
    padding: 6,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  name: { 
    color: colors.textPrimary, 
    fontSize: 13.5, 
    fontWeight: '800' 
  },
  meta: { 
    color: colors.textSecondary, 
    fontSize: 11, 
    marginTop: 2,
    letterSpacing: 0.2 
  },
});