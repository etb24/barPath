import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, ActivityIndicator, Pressable, Platform } from 'react-native';
import { signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from '../../services/FirebaseConfig';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const LOGO = require('../../assets/images/logo.png');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '178258878322-t57cm3fjt2shdnf4iketkjh8n8spjaro.apps.googleusercontent.com',
    });
  }, []);

  const onGoogleButtonPress = async () => {
    try {
      setLoading(true);
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token found');
      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
      // user is now signed in
    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED || err?.code === statusCodes.IN_PROGRESS) return;
      console.error('Google sign-in error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Image
            source={LOGO}
            style={styles.logoImage}
            resizeMode="contain"
            accessible
            accessibilityLabel="BarPath logo"
          />
        </View>
        <Text style={styles.title}>barPath.io</Text>
        <Text style={styles.subtitle}>Track your lifts. See your progress.</Text>
      </View>

      <View style={styles.card}>

        <GoogleSigninButton
          style={styles.googleButton}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={onGoogleButtonPress}
          disabled={loading}
          accessibilityLabel="Sign in with Google"
          testID="google-signin-button"
        />

        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

        {/* TODO: Add Terms & Privacy links*/} 
        <Text style={styles.legal}>
          By continuing you agree to our
          <Text style={styles.link}> Terms</Text> &
          <Text style={styles.link}> Privacy</Text>.
        </Text>
      </View>

      <Text style={styles.footer}>Made for lifters • v1.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  // new image style
  logoImage: {
    width: 40,
    height: 40,
  },
  title: {
    color: '#C2FD4E',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#A3A3A3',
    fontSize: 15,
    marginTop: 6,
  },
  card: {
    width: '100%',
    padding: 20,
    backgroundColor: '#0B0B0B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  googleButton: {
    width: '100%',
    height: 48,
    borderRadius: 22,
    alignSelf: 'center',
    maxWidth: 240,
  },
  legal: {
    color: '#A3A3A3',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
  link: {
    color: '#EDEDED',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    color: '#A3A3A3',
    fontSize: 12,
  },
});
