//LEGACY: This file is a legacy API wrapper for the old Firebase Storage + FastAPI backend. It is used by the old video processing flow, which is being replaced by the new VideoProcessingService.ts. The new service uses the new File/Paths class API from expo-file-system v19, and does not require Firebase Storage or FastAPI. This file will be removed once the new service is fully implemented and tested.
// expo-file-system v19 moved the function API to /legacy; TODO migrate to the new File/Paths class API
import * as FileSystem from 'expo-file-system/legacy';
import { getAuth } from '@react-native-firebase/auth';
import { ref as storageRef, putFile } from '@react-native-firebase/storage';
import { storageDb } from './FirebaseConfig';

const API_BASE = 'http://localhost:8000';  // fastAPI URL

function requireUser() {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Not signed in');
  return user;
}

export async function processVideo(inputUri: string): Promise<{
  localUri: string;
  blobPath: string;
}> {
  const user = requireUser();
  const idToken = await user.getIdToken();
  const ts = Date.now().toString();

  // upload raw to `${uid}/raw/${ts}.mp4`
  const rawPath = `${user.uid}/raw/${ts}.mp4`;
  await putFile(storageRef(storageDb, rawPath), inputUri);

  const res = await fetch(`${API_BASE}/process_from_bucket`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ blob_path: rawPath }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  // expect both URL and path back from the server
  const { url, out_blob_path } = (await res.json()) as {
    url: string;
    out_blob_path: string;
  };

  // download preview locally
  const localUri = `${FileSystem.cacheDirectory}${ts}_processed.mp4`;
  await FileSystem.downloadAsync(url, localUri);

  // return both the file URI and the bucket path
  return {
    localUri,
    blobPath: out_blob_path,
  };
}

export async function promotePreview(previewPath: string): Promise<{
  blobPath: string;
  status: 'saved';
}> {
  const user = requireUser();
  const idToken = await user.getIdToken();

  const res = await fetch(`${API_BASE}/promote_preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ preview_path: previewPath }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}