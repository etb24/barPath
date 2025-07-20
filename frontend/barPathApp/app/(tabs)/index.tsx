import React from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as VideoPicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';

export default function HomeScreen() {
  const router = useRouter();
  const auth   = getAuth();
  const user   = auth.currentUser;

  const pickAndProcess = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    const result = await VideoPicker.launchImageLibraryAsync({
      mediaTypes: VideoPicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    // navigate to processing with the local URI + metadata
    router.push({
      pathname: '/processing',
      params: {
        inputUri: result.assets[0].uri,
        liftName: 'My Lift',          // TODO: prompt the user for a name here
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Barbell Tracker</Text>
      <Text style={styles.subtitle}>
        {user?.email ? `Welcome, ${user?.displayName}` : 'Welcome!'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={pickAndProcess}>
        <Text style={styles.buttonText}>Pick & Process Video</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#ffd33d',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,   // for Android shadow
  },
  buttonText: {
    color: '#25292e',
    fontSize: 16,
    fontWeight: '600',
  },
});
