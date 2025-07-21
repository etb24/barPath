import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Dimensions, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { getAuth } from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
//import { auth, storageDb, db } from '../services/FirebaseConfig';


// TODO: FIX DEPRECATIONS, FIX MODAL

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
  const user = getAuth().currentUser!;
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VideoItem|null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = firestore()
      .collection('users').doc(user.uid)
      .collection('videos').orderBy('processedAt','desc')
      .onSnapshot(snap => {
        const items = snap.docs.map(d => ({
          id:           d.id,
          ...(d.data() as any),
        }));
        setVideos(items);
        setLoading(false);
      }, err => {
        Alert.alert('Error', err.message);
        setLoading(false);
      });
    return unsub;
  }, []);

  async function handleDelete(item: VideoItem) {
  setBusy(true);
  try {
    // try to delete the file, but don’t abort if it’s already gone
    try {
      await storage().ref(`${user.uid}/${item.id}.mp4`).delete();
    } catch (e: any) {
      if (e.code === 'storage/object-not-found') {
        console.warn(`Storage file missing, ignoring: ${item.id}.mp4`);
      } else {
        // re‑throw unexpected errors
        throw e;
      }
    }
    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('videos')
      .doc(item.id)
      .delete();

    Alert.alert('Deleted', 'Video removed from your library.');
  } catch (e: any) {
    console.error(e);
    Alert.alert('Error', e.message);
  } finally {
    setBusy(false);
    setSelected(null);
  }
  }

  const handleSave = async (item: VideoItem) => {
    setBusy(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission denied');
      // download remote URL → local
      const filename = item.thumbnailUrl.split('/').pop() || `${item.id}.mp4`;
      const localUri = FileSystem.cacheDirectory + filename;
      const dl       = await FileSystem.downloadAsync(item.url, localUri);
      if (dl.status !== 200) throw new Error(`Download failed: ${dl.status}`);
      // save to camera roll
      const asset = await MediaLibrary.createAssetAsync(dl.uri);
      await MediaLibrary.createAlbumAsync('BarbellTracker', asset, false);
      Alert.alert('Saved','Video saved to camera roll.');
      await FileSystem.deleteAsync(dl.uri,{idempotent:true});
    } catch(e:any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  const renderThumb = ({ item }: {item:VideoItem}) => (
    <TouchableOpacity
      style={styles.thumbContainer}
      onPress={() => setSelected(item)}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
      <Text numberOfLines={1} style={styles.thumbLabel}>{item.liftName}</Text>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color="#ffd33d" size="large"/></View>
  );
  if (videos.length===0) return (
    <View style={styles.center}><Text style={styles.emptyText}>No saved videos.</Text></View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={v=>v.id}
        renderItem={renderThumb}
        numColumns={2}
        columnWrapperStyle={{justifyContent:'space-between'}}
        contentContainerStyle={{padding:16}}
      />

      <Modal visible={!!selected} animationType="slide">
        <View style={styles.modal}>
          {selected && <>
            <Video
              source={{uri:selected.url}}
              style={styles.modalVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.baseButton,styles.saveButton]}
                onPress={()=>handleSave(selected)} disabled={busy}
              >
                {busy ? <ActivityIndicator/> : <Text>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.baseButton,styles.deleteButton]}
                onPress={()=>handleDelete(selected)} disabled={busy}
              >
                <Text>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.baseButton,styles.discardButton]}
                onPress={()=>setSelected(null)} disabled={busy}
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
