import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from '../../services/FirebaseConfig';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii } from '../styles/theme';

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
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Typography variant="title" weight="black" color={colors.accent} style={styles.brand}>
            barPath.io
          </Typography>
          <View style={styles.logoBadge}>
            <Image
              source={LOGO}
              style={styles.logoImage}
              resizeMode="contain"
              accessible
              accessibilityLabel="BarPath logo"
            />
          </View>
          <Typography variant="hero" weight="black" style={styles.title}>
            Track smarter, lift safer
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Sign in to sync your bar path analyses and view your training archive on any device.
          </Typography>
        </View>

        <Card style={styles.card}>
          <GoogleSigninButton
            style={styles.googleButton}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={onGoogleButtonPress}
            disabled={loading}
            accessibilityLabel="Sign in with Google"
            testID="google-signin-button"
          />

          {loading && <ActivityIndicator style={{ marginTop: spacing.md }} color={colors.accent} />}

          <Typography variant="caption" color={colors.textMuted} style={styles.legal}>
            By continuing you agree to our{' '}
            <Typography variant="caption" color={colors.textSecondary}>Terms</Typography>
            {' & '}
            <Typography variant="caption" color={colors.textSecondary}>Privacy</Typography>.
          </Typography>
        </Card>

        <Typography variant="caption" color={colors.textMuted} style={styles.footer}>
          Made for lifters • v1.0
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  brand: {
    letterSpacing: 1,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // new image style
  logoImage: {
    width: 40,
    height: 40,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    height: 48,
    borderRadius: 22,
    alignSelf: 'center',
    maxWidth: 240,
  },
  legal: {
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
  },
});
