import React, { useEffect, useState } from 'react';
import { View, Button, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, VideoReadyForDisplayEvent } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';

export default function PreviewScreen() {
  const { processedUri } = useLocalSearchParams<{ processedUri: string }>();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // start with a default aspect ratio for container fitting
  const [ratio, setRatio] = useState<number>(16 / 9);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const saveToCameraRoll = async () => {
    if (!hasPermission) {
      Alert.alert('Permission required', 'Please allow photo access to save the video.');
      return;
    }
    try {
      const asset = await MediaLibrary.createAssetAsync(processedUri);
      await MediaLibrary.createAlbumAsync('BarbellTracker', asset, false);
      Alert.alert('Saved!', 'Your video has been saved to your camera roll.');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    }
  };

  const discard = () => {
    router.replace('/(tabs)');
  };

   const saveToLibrary = () => {
    // TODO: hook Firebase/Firestore library‐save logic here
    Alert.alert('Library', 'Save to library not implemented yet.');
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
            setRatio(width / height);
          }}
        />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveToCameraRoll}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.button]} onPress={discard}>
          <Text style={styles.buttonText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveToLibrary}>
          <Text style={styles.buttonText}>Save to Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    backgroundColor:'#25292e',
    padding:        16,
    justifyContent: 'center',
    alignItems:     'center',
  },

  videoCard: {
    width:          '100%',
    height:         600,
    borderRadius:   16,
    borderWidth:    4,
    borderColor:    '#ffd33d',
    overflow:       'hidden',
    marginBottom:   20,
    backgroundColor:'#000',
  },

  video: {
    flex: 1,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },

  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#444',
    alignItems: 'center',
    marginHorizontal: 5,
  },

  saveButton: {
    backgroundColor: '#ffd33d',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});