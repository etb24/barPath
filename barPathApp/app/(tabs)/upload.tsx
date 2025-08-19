import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, StatusBar, SafeAreaView, Platform,ActivityIndicator,} from 'react-native';
import * as VideoPicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';

export default function HomeScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [opening, setOpening] = useState(false);

  const pickAndProcess = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }
    try {
      setOpening(true);
      const result = await VideoPicker.launchImageLibraryAsync({
        mediaTypes: VideoPicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      router.push({
        pathname: '/processing',
        params: {
          inputUri: result.assets[0].uri,
          liftName: 'My Lift',
        },
      });
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' />
      <View style={styles.content}>
        <View style={styles.badge} accessible accessibilityLabel='barPath dot io'>
          <Text style={styles.badgeText}>barPath.io</Text>
        </View>

        <Text style={styles.title}>Upload your lift</Text>
        <View style={styles.card} testID='upload-card' accessibilityRole='summary'>
          <Text style={styles.cardTitle}>Pick a video</Text>
          <Text style={styles.cardSubtitle}>
            less than 2 minutes for best results
          </Text>

          <Pressable
            onPress = {pickAndProcess}
            disabled = {opening}
            android_ripple = {{ color: 'rgba(0,0,0,0.15)' }}
            accessibilityRole = 'button'
            accessibilityLabel = {opening ? 'Opening video library' : 'Upload Video'}
            testID='pick-process-button'
            style = {({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              opening && styles.buttonDisabled,
            ]}
          >
            <View style = {styles.buttonInner}>
              {opening && (
                <ActivityIndicator size = 'small' color = '#111' style = {styles.spinner} />
              )}
              <Text style = {styles.buttonText}>
                {opening ? 'Opening…' : 'Upload Video'}
              </Text>
            </View>
          </Pressable>

          <Text style = {styles.hint}>
            Tip: keep the lifter fully in frame and avoid slow‑motion clips.
          </Text>
        </View>

        <Text style = {styles.footerNote}>
          Your video stays private and is used only to analyze your lift.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#101010',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: '#CFCFCF',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#A3A3A3',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#151515',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    // soft shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#B5B5B5',
    fontSize: 13,
    marginBottom: 14,
  },

  button: {
    backgroundColor: '#C2FD4E',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    // shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    marginRight: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hint: {
    marginTop: 10,
    color: '#8C8C8C',
    fontSize: 12,
    textAlign: 'center',
  },
  footerNote: {
    marginTop: 16,
    color: '#7B7B7B',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 15,
  },
});