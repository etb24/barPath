import * as FileSystem from 'expo-file-system';

const API_BASE = 'http://localhost:8000';  // FastAPI URL

/**
 * Uploads a video file to the /process endpoint, downloads the processed video,
 * writes it into cacheDirectory, and returns its file:// URI.
 */
export async function uploadVideo(inputUri: string): Promise<string> {
  // build form‑data
  const formData = new FormData();
  formData.append('file', {
    uri:  inputUri,
    name: inputUri.split('/').pop(),
    type: 'video/mp4',
  } as any);

  // post to FastAPI
  const res = await fetch(`${API_BASE}/process`, {
    method:  'POST',
    body:    formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);

  // grab Blob
  const blob = await res.blob();

  // convert Blob → base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  // write base64 into a file in cacheDirectory
  const outUri = FileSystem.cacheDirectory + 'processed.mp4';
  await FileSystem.writeAsStringAsync(outUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return outUri;  
}
