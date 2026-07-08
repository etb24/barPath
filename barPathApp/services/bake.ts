// Client side of the bake feature: ask the Cloud Function to render the bar path into a shareable MP4, then download that file locally for camera-roll / share.
import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import * as FileSystem from 'expo-file-system';
import { storageDb, storageRef, getDownloadURL } from './FirebaseConfig';

// Returns a local file:// URI to the baked MP4.
export async function bakeVideo(videoId: string): Promise<string> {
  const functions = getFunctions(getApp());
  const callable = httpsCallable<{ videoId: string }, { bakedBlobPath: string }>(
    functions,
    'bake_video',
  );

  const { data } = await callable({ videoId });
  if (!data?.bakedBlobPath) throw new Error('Baking returned no file.');

  const url = await getDownloadURL(storageRef(storageDb, data.bakedBlobPath));
  const localUri = `${FileSystem.cacheDirectory}${videoId}_baked.mp4`;
  const res = await FileSystem.downloadAsync(url, localUri);
  if (res.status !== 200) throw new Error(`Download failed (${res.status})`);
  return res.uri;
}
