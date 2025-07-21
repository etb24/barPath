import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, } from 'react-native';
import { Video, ResizeMode, VideoReadyForDisplayEvent } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ref as storageRef, getDownloadURL, putFile } from '@react-native-firebase/storage';
import { collection, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { auth, storageDb, db } from '../services/FirebaseConfig';

export default function PreviewScreen() {
  const { processedUri, liftName } = useLocalSearchParams<{
    processedUri: string;
    liftName?:    string;
  }>();
  const router = useRouter();
  const user   = auth.currentUser!;
  

  const [hasPermission, setHasPermission] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ratio, setRatio] = useState(16/9);

  // request local-save permission once
  useEffect(() => {
    MediaLibrary.requestPermissionsAsync()
      .then(({ status }) => setHasPermission(status === 'granted'))
      .catch(() => setHasPermission(false));
  }, []);

  // save to Camera Roll (local file)
  const saveToCameraRoll = async () => {
    if (!hasPermission) {
      return Alert.alert('Permission required', 'Allow photo access to save.');
    }
    try {
      setBusy(true);
      const asset = await MediaLibrary.createAssetAsync(processedUri);
      await MediaLibrary.createAlbumAsync('BarbellTracker', asset, false);
      Alert.alert('Saved', 'Video saved to camera roll.');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  async function saveToLibrary( processedUri: string, liftName: string ): Promise<void> {
  const user    = auth.currentUser!;
  const videoId = Date.now().toString();

  // upload the video file
  const vidPath = `${user.uid}/${videoId}.mp4`;
  const vidRef  = storageRef(storageDb, vidPath);
  await putFile(vidRef, processedUri);
  const url     = await getDownloadURL(vidRef);

  // generate a thumbnail locally (to optimize thumbnail generation)
  const { uri: thumbLocalUri } = await VideoThumbnails.getThumbnailAsync(
    processedUri,
    { time: 1000, quality: 0.5 }
  );

  // upload the thumbnail JPEG
  const thumbPath = `${user.uid}/thumbs/${videoId}.jpg`;
  const thumbRef  = storageRef(storageDb, thumbPath);
  await putFile(thumbRef, thumbLocalUri);
  const thumbnailUrl = await getDownloadURL(thumbRef);

  // write both URLs + metadata to Firestore
  const videosCol = collection(db, 'users', user.uid, 'videos');
  const videoDoc  = doc(videosCol, videoId);
  await setDoc(videoDoc, {
    url,
    thumbnailUrl,
    liftName,
    processedAt: serverTimestamp(),
  });

  Alert.alert('Saved', 'Video added to your library.');
  };

  const discard = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.videoCard, { aspectRatio: ratio }]}>
        <Video
          source={{ uri: processedUri }}
          style={styles.video}
          shouldPlay
          isLooping
          resizeMode={ResizeMode.COVER}
          onReadyForDisplay={(e: VideoReadyForDisplayEvent) => {
            const { width, height } = e.naturalSize;
            if (width && height) setRatio(width / height);
          }}
        />
      </View>

      <View style={styles.saveRow}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveToCameraRoll}
          disabled={busy}
        >
          <Text style={styles.saveButtonText}>Save to Camera Roll</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => saveToLibrary(processedUri, liftName || 'Unknown Lift')}
          disabled={busy}
        >
         {/* TODO: FIX THIS so activity indicator works */}
          {busy
            ? <ActivityIndicator color="#25292e" />
            : <Text style={styles.saveButtonText}>Save to Library</Text>
          }
        </TouchableOpacity>
      </View>

      <View style={styles.discardRow}>
        <TouchableOpacity
          style={[styles.button, styles.discardButton]}
          onPress={discard}
          disabled={busy}
        >
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    paddingTop: 75,
    padding: 16,
    alignItems: 'center',
  },
  videoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#ffd33d',
    overflow: 'hidden',
    backgroundColor:'#000',
    marginBottom: 20,
  },
  video: {
    flex: 1,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  discardRow: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#ffd33d',
    width: '48%',
  },
  discardButton: {
    backgroundColor: '#ff4444',
    width: '40%',
  },
  saveButtonText: {
    color: '#25292e',
    fontSize: 16,
    fontWeight: '600',
  },
  discardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});