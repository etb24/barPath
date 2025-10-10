import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, Alert,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, VideoReadyForDisplayEvent } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {
  ref as storageRef,
  deleteObject,
  getDownloadURL,
  putFile,
} from '@react-native-firebase/storage';
import {
  collection, doc, setDoc, serverTimestamp
} from '@react-native-firebase/firestore';
import { auth, storageDb, db } from '../../services/FirebaseConfig';
import { promotePreview } from '../../services/api';
import Screen from '../components/ui/Screen';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii } from '../styles/theme';

export default function PreviewScreen() {
  const {
    processedUri,
    blobPath,
    liftName = 'Unknown Lift',
  } = useLocalSearchParams<{
    processedUri: string;
    blobPath: string;
    liftName?: string;
  }>();
  const router = useRouter();
  const user = auth.currentUser!;

  const [hasPermission, setHasPermission] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ratio, setRatio] = useState(16/9);

  // ask for camera‐roll permission
  useEffect(() => {
    MediaLibrary.requestPermissionsAsync()
      .then(({ status }) => setHasPermission(status === 'granted'))
      .catch(() => setHasPermission(false));
  }, []);

  // save locally
  const saveToCameraRoll = async () => {
    if (!hasPermission) {
      return Alert.alert('Permission required', 'Allow photo access to save.');
    }
    try {
      setBusy(true);
      const asset = await MediaLibrary.createAssetAsync(processedUri);
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
  };

  const saveToLibrary = async () => {
    setBusy(true);
    try {
      const parts = blobPath.split('/');
      const filename = parts[parts.length - 1];
      const videoId = filename.replace(/\.mp4$/i, '');

      // make thumbnail
      const { uri: thumbLocalUri } = await VideoThumbnails.getThumbnailAsync(
        processedUri,
        { time: 1000, quality: 0.5 }
      );

      const thumbPath = `${user.uid}/thumbs/${videoId}.jpg`;
      const thumbRef  = storageRef(storageDb, thumbPath);
      await putFile(thumbRef, thumbLocalUri);
      const thumbnailUrl = await getDownloadURL(thumbRef);

      console.log("RN blobPath → function:", blobPath);
      
      // promote on server
      await promotePreview(blobPath);

      // merge metadata into Firestore
      const videosCol = collection(db, 'users', user.uid, 'videos');
      const videoDoc = doc(videosCol, videoId);
      await setDoc(videoDoc, {
        thumbnailUrl,
        liftName,
        processedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Saved', 'Video added to your library.');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy(false);
    }
  };


  // delete the preview blob from Storage
  const discard = async () => {
    setBusy(true);
    try {
      const procRef = storageRef(storageDb, blobPath);
      await deleteObject(procRef);
    } catch (e: any) {
      console.warn('Failed to delete preview:', e.message);
    } finally {
      setBusy(false);
      router.replace('/(tabs)');
    }
  };

  return (
    <Screen>
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
            <Typography variant="subtitle" weight="bold" color={colors.background}>
              Save to Camera Roll
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveToLibrary}
            disabled={busy}
          >
            {busy
            ? <ActivityIndicator color={colors.background} />
            : <Typography variant="subtitle" weight="bold" color={colors.background}>
                Save to Library
              </Typography>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.discardRow}>
          <TouchableOpacity
            style={[styles.button, styles.discardButton]}
            onPress={discard}
            disabled={busy}
          >
            <Typography variant="subtitle" weight="bold" color={colors.textPrimary}>
              Discard
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  videoCard: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 4,
    borderColor: colors.accent,
    overflow: 'hidden',
    backgroundColor:'#000',
    marginBottom: spacing.lg,
  },
  video: {
    flex: 1,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  discardRow: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent,
    width: '48%',
  },
  discardButton: {
    backgroundColor: colors.destructive,
    width: '40%',
  },
});