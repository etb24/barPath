import { getAuth } from '@react-native-firebase/auth';

const API_URL = 'http://localhost:8000'; //change to server IP

export const getAuthToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  //gets a fresh token from Firebase
  return await user.getIdToken();
};

export const uploadVideo = async (videoUri: string, title: string) => {
  try {
    //get the token from the logged-in user
    const token = await getAuthToken();
    
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'video.mp4',
    } as any);
    formData.append('title', title);

    const response = await fetch(`${API_URL}/api/videos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};