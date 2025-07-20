import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { uploadVideo } from '../services/api';

export default function ProcessingScreen() {
  const { inputUri } = useLocalSearchParams<{ inputUri: string }>();
  const router       = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const processedUri = await uploadVideo(inputUri);
        // as soon as it’s written locally, navigate to preview
        router.replace({
          pathname: '/preview',
          params:   { processedUri },
        });
      } catch (e: any) {
        Alert.alert('Processing failed', e.message || 'Unknown error');
        router.replace('/');
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffd33d" />
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
});