import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadVideo } from '../../services/api';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';

export default function HomeScreen() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const pickVideo = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string) => {
    try {
      setUploading(true);
      
      const response = await uploadVideo(uri, 'My Lift');
      
      console.log('Upload successful:', response);
      Alert.alert('Success', 'Video uploaded for processing!');
      
    } catch (error) {
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome {user?.email}</Text>
      <Button 
        title={uploading ? "Uploading..." : "Upload Video"} 
        onPress={pickVideo}
        disabled={uploading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginBottom: 20,
  },
});