import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import Constants from 'expo-constants';
import { signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from '../../services/FirebaseConfig';
import Screen from '../components/ui/Screen';
import Typography from '../components/ui/Typography';
import { colors, spacing } from '@/styles/theme';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;

export default function Login() {
  const [loading, setLoading] = useState(false);

  const LOGO = require('../../assets/images/logo.png');

  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      console.warn('googleWebClientId missing from app.json extra');
      return;
    }
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
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
    <Screen>
      <View style={styles.container}>
        <Image
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessible
          accessibilityLabel="BarPath logo"
        />
        <Typography variant="title" weight="black">
          barPath.io
        </Typography>

        <GoogleSigninButton
          style={styles.googleButton}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={onGoogleButtonPress}
          disabled={loading}
          accessibilityLabel="Sign in with Google"
          testID="google-signin-button"
        />

        {loading && <ActivityIndicator color={colors.accent} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  logo: {
    width: 64,
    height: 64,
  },
  googleButton: {
    width: '100%',
    maxWidth: 240,
    height: 48,
  },
});
