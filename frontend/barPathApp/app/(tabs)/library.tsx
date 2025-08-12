import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Dimensions, TouchableOpacity, Image, ActivityIndicator, Platform, } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { auth, db, collection, onSnapshot, query, orderBy, storageDb, storageRef, doc, deleteDoc, deleteObject, getDownloadURL,} from '../../services/FirebaseConfig';
import { QueryDocumentSnapshot } from '@firebase/firestore-types';
import { FirebaseFirestoreTypes, updateDoc, } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import PreviewModal from '../components/PreviewModal';

// TODO : FIX FIRESTORE DEPRECATIONS, FIX RENAME STATE CHANGE, UPDATE MODAL

interface VideoItem {
  id: string;
  blobPath: string;
  url: string;
  thumbnailUrl: string;
  liftName: string;
  processedAt: FirebaseFirestoreTypes.Timestamp;
}

// thumbnail dimensions for styles
const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - 48) / 2;

export default function LibraryScreen() {
  const [user, setUser] = useState<typeof auth.currentUser | null>(auth.currentUser);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<VideoItem|null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
  const stop = auth.onAuthStateChanged(setUser);
  return stop;
  }, []);

  useEffect(() => {
    if (!user) {
      setVideos([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    const videosQuery = query(
      collection(db, 'users', user.uid, 'videos'),
      orderBy('processedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      videosQuery,
      async (snapshot) => {
        // avoid spinner on every tiny change
        setLoading((prev) => prev && videos.length === 0);

        const results = await Promise.allSettled<VideoItem>(
          snapshot.docs.map(async (d: QueryDocumentSnapshot<any>) => {
            const data = d.data();
            const blobPath = String(data.blobPath || '');

            // only fetch URLs under this user's folder
            if (!blobPath.startsWith(`${user.uid}/`)) {
              throw new Error(`unauthorized path: ${blobPath}`);
            }

            const url = await getDownloadURL(storageRef(storageDb, blobPath));

            return {
              id: d.id,
              blobPath,
              url,
              thumbnailUrl: data.thumbnailUrl ?? '',
              liftName: data.liftName ?? 'Untitled',
              processedAt: data.processedAt,
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

        // alert if nothing could be shown at all
        if (hadErrors && items.length === 0) {
          Alert.alert('Some videos couldn’t be loaded', 'Please try again later.');
        }
      },
      (error) => {
        const signedOut = !auth.currentUser;
        // @ts-expect-error - code might not exist on generic error
        if (signedOut && error?.code === 'permission-denied') return;
        // query-level errors
        console.error(error);
        setLoading(false);
        Alert.alert('Error', error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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
      if (!user) {
        throw new Error('User not authenticated');
      }
      // delete the MP4 from storage
      const vidRef = storageRef(storageDb, item.blobPath);
      await deleteObject(vidRef).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });

      // thumbnail
      const thumbRef = storageRef(storageDb, `${user.uid}/thumbs/${item.id}.jpg`);
      await deleteObject(thumbRef).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });

      // Firestore document
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

  async function handleSave(item: VideoItem) {
    setBusy(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Photo library permission not granted');
      }

      // use item.id so there are no query‑strings in the filename
      const filename = `${item.id}.mp4`;
      const localUri = FileSystem.cacheDirectory + filename;

      // download the mp4 to localUri
      const downloadRes = await FileSystem.downloadAsync(item.url, localUri);
      if (downloadRes.status !== 200) {
        throw new Error(`Download failed with status ${downloadRes.status}`);
      }

      // add to camera roll
      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
      const album = await MediaLibrary.getAlbumAsync('BarbellTracker');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('BarbellTracker', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Saved', 'Video has been saved to your camera roll!');
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  function openRename(item: VideoItem) {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        "Rename Video", // title
        "Enter a new name for your video", // optional message
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (newName?: string) => {
              if (typeof newName !== 'string' || !newName.trim()) return;
              try {
                // update Firestore (deprecated)
                if (!user) {
                  throw new Error('User not authenticated');
                }
                await firestore()
                  .collection('users')
                  .doc(user.uid)
                  .collection('videos')
                  .doc(item.id)
                  .update({ liftName: newName });

                // update local state
                setVideos(videos =>
                  videos.map(v =>
                    v.id === item.id ? { ...v, liftName: newName } : v
                  )
                );

                setSelected(null); // close preview
              } catch (e: any) {
                Alert.alert("Rename failed", e.message);
              }
            }
          }
        ],
        "plain-text",
        item.liftName // prefill with the current name
      );
    }
  }

    
  const renderThumb = ({ item }: {item:VideoItem}) => (
    <TouchableOpacity
      style={styles.thumbContainer}
      onPress={() => setSelected(item)}
    >
      <Image source = {{ uri: item.thumbnailUrl }} style = {styles.thumb} />
      <TouchableOpacity onPress={() => openRename(item)}>
        <Text numberOfLines={1} style={styles.thumbLabel}>
          {item.liftName}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style = {styles.center}><ActivityIndicator color = "#ffd33d" size="large"/></View>
  );
  if (videos.length === 0) return (
    <View style = {styles.center}><Text style = {styles.emptyText}>No saved videos.</Text></View>
  );

  return (
    <View style = {styles.container}>
      <FlatList
        data = {videos}
        keyExtractor = {v => v.id}
        renderItem = {renderThumb}
        numColumns = {2}
        columnWrapperStyle = {{justifyContent:'space-between'}}
        contentContainerStyle = {{padding:16}}
      />
      {selected && (
        <PreviewModal
          visible={true}
          item={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onSave={() => handleSave(selected)}
          onDelete={() => handleDelete(selected)}
          onRename={() => openRename(selected)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor:'#25292e'
  },
  center: {
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'#25292e'
  },
  emptyText: {
    color:'#aaa',
    fontSize:16
  },

  thumbContainer: {
    marginBottom: 16,
    width: THUMB_SIZE,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * (16 / 9),
    borderRadius: 10,
    backgroundColor: '#000',
  },
  thumbLabel: {
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
});