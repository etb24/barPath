import { SafeAreaView, Text, Button, StyleSheet } from 'react-native';
import React from 'react';
import { getAuth, signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

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
  const auth = getAuth();
  return signInWithCredential(auth, googleCredential);
}

export default function Login() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Login Screen</Text>
      <GoogleSigninButton
        onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
      />
    </SafeAreaView>
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
  },
});