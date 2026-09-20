import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from '@/services/FirebaseConfig';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import Typography from '@/components/ui/Typography';
import { colors, layout, spacing } from '@/styles/theme';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
const LOGO = require('../../assets/images/splash-icon.png');

const LOGO_SIZE = 96;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      console.warn('googleWebClientId missing from app.json extra');
      return;
    }
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) throw new Error('Google did not return an ID token');
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      // RootLayout's auth listener moves us onto the tabs
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) return;
      console.error('Google sign-in error', error);
      Alert.alert('Sign-in failed', 'Something went wrong signing in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="barPath logo" />
            <Typography variant="display">barPath</Typography>
          </View>
          <View style={styles.copy}>
            <Typography variant="heading" align="center">
              See the bar path on every rep.
            </Typography>
            <Typography variant="body" color={colors.textSecondary} align="center">
              Pick a lift video and get a color-coded trace of the bar, tracked entirely on your phone.
            </Typography>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Continue with Google"
            icon="logo-google"
            variant="secondary"
            fullWidth
            loading={loading}
            onPress={signInWithGoogle}
            testID="google-signin-button"
          />
          <Typography variant="caption" color={colors.textMuted} align="center">
            Videos are analyzed on your device. Only the lifts you save are uploaded to your library.
          </Typography>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  copy: {
    gap: spacing.xs,
    maxWidth: 320,
  },
  footer: {
    gap: spacing.md,
  },
});
