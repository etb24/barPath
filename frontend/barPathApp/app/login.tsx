import { SafeAreaView, Text, Button, StyleSheet } from 'react-native';
import React from 'react';
import { signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { auth } from '../services/FirebaseConfig';


GoogleSignin.configure({
  webClientId: '178258878322-t57cm3fjt2shdnf4iketkjh8n8spjaro.apps.googleusercontent.com',
});

async function onGoogleButtonPress() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  
  if (!idToken) {
    throw new Error('No ID token found');
  }

  const googleCredential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, googleCredential);
}

export default function Login() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to BarPath</Text>
      <Text style={styles.subtitle}>
        Sign in with Google to start tracking your lifts.
      </Text>

        <GoogleSigninButton
          style={styles.googleButton}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={() =>
            onGoogleButtonPress()
              .catch(err => console.error('Google sign-in error', err))
          }
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  title: {
    color: '#ffd33d',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    width: 230,
    height: 48,
  },
});