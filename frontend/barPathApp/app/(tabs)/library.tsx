import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Dimensions, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import firestore, {
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import { auth, db, collection, onSnapshot, query, orderBy, storageDb, storageRef, doc, deleteDoc, deleteObject} from '../../services/FirebaseConfig';
import { QueryDocumentSnapshot } from '@firebase/firestore-types';


// TODO : FIX MODAL AND FORMATTING

interface VideoItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  liftName: string;
  processedAt: FirebaseFirestoreTypes.Timestamp;
}

const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - 48) / 2;

export default function LibraryScreen() {
  const user = auth.currentUser!;
  const [videos, setVideos]   = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<VideoItem|null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setVideos([]);
      setLoading(false);
      return;
    }

    // build a typed query
    const videosQuery = query(
      collection(db, 'users', user.uid, 'videos'),
      orderBy('processedAt', 'desc')
    );

    // subscribe
    const unsubscribe = onSnapshot(
      videosQuery,
      snapshot => {
        const items = snapshot.docs.map(
          (d: QueryDocumentSnapshot<VideoItem>) => ({
            ...d.data(),  // d.data() is now typed as VideoItem
            id: d.id,
          })
        );
        setVideos(items);
        setLoading(false);
      },
      error => {
        Alert.alert('Error', error.message);
        setLoading(false);
      }
    );

    // cleanup
    return () => unsubscribe();
  }, [user]);

  async function handleDelete(item: VideoItem) {
  setBusy(true);
  try {
    // delete the MP4 from storage
    const vidRef = storageRef(storageDb, `${user.uid}/${item.id}.mp4`);
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

    // get mp4 filename from the video URL
    const parts   = item.url.split('/');
    const filename = parts[parts.length - 1] || `video-${item.id}.mp4`;
    const localUri = FileSystem.cacheDirectory + filename;

    // download the mp4 to localUri
    const downloadRes = await FileSystem.downloadAsync(item.url, localUri);
    if (downloadRes.status !== 200) {
      throw new Error(`Download failed with status ${downloadRes.status}`);
    }
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


  const renderThumb = ({ item }: {item:VideoItem}) => (
    <TouchableOpacity
      style={styles.thumbContainer}
      onPress={() => setSelected(item)}
    >
      <Image source = {{ uri: item.thumbnailUrl }} style = {styles.thumb} />
      <Text numberOfLines = {1} style = {styles.thumbLabel}>{item.liftName}</Text>
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

      <Modal visible = {!!selected} animationType="slide">
        <View style = {styles.modal}>
          {selected && <>
            <Video
              source = {{uri:selected.url}}
              style = {styles.modalVideo}
              useNativeControls
              resizeMode = {ResizeMode.CONTAIN}
              shouldPlay
            />
            <View style = {styles.modalButtons}>
              <TouchableOpacity
                style = {[styles.baseButton,styles.saveButton]}
                onPress = {()=>handleSave(selected!)} disabled={busy}
              >
                {busy ? <ActivityIndicator/> : <Text>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style = {[styles.baseButton,styles.deleteButton]}
                onPress = {()=>handleDelete(selected)} disabled={busy}
              >
                <Text>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style = {[styles.baseButton,styles.discardButton]}
                onPress = {()=>setSelected(null)} disabled={busy}
              >
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </>}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1,backgroundColor:'#25292e'},
  center: {flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#25292e'},
  emptyText: {color:'#aaa',fontSize:16},

  thumbContainer:{marginBottom:16,width:THUMB_SIZE},
  thumb: {width:THUMB_SIZE,height:THUMB_SIZE*(9/16),borderRadius:8,backgroundColor:'#000'},
  thumbLabel: {color:'#fff',marginTop:4,textAlign:'center'},

  modal: {flex:1,backgroundColor:'#000',justifyContent:'center',alignItems:'center',padding:16},
  modalVideo: {width:'100%',height:'50%',backgroundColor:'#000'},
  modalButtons:  {flexDirection:'row',justifyContent:'space-around',width:'100%',marginTop:24},

  baseButton: {paddingVertical:12,paddingHorizontal:16,borderRadius:8,alignItems:'center'},
  saveButton: {backgroundColor:'#ffd33d'},
  deleteButton: {backgroundColor:'#ff4444'},
  discardButton: {backgroundColor:'#444'},
});