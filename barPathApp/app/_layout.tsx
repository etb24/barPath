import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import type { User } from '@react-native-firebase/auth';
import { auth, onAuthStateChanged } from '@/services/FirebaseConfig';
import { colors } from '@/styles/theme';

// Keep the native splash up until Firebase says whether someone is signed in, so launch goes
// splash -> the right screen, instead of splash -> spinner -> screen.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 250, fade: true });

const SPLASH_FAILSAFE_MS = 4000; // never strand a user on the splash if auth never reports back
const PROTECTED_LEAVES = ['processing', 'preview'];

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    const failsafe = setTimeout(() => setInitializing(false), SPLASH_FAILSAFE_MS);
    return () => {
      unsubscribe();
      clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync().catch(() => undefined);
  }, [initializing]);

  useEffect(() => {
    if (initializing) return;

    const root = (segments[0] ?? '') as string; // "(tabs)" | "(screens)" | ""
    const leaf = ((segments[segments.length - 1] ?? '') as string).toLowerCase();

    const inTabs = root === '(tabs)';
    const isLogin = leaf === 'login';
    const inProtected = PROTECTED_LEAVES.includes(leaf);

    if (user) {
      if (isLogin) router.replace('/');
    } else if (inTabs || inProtected) {
      router.replace('/login');
    }
  }, [user, initializing, segments, router]);

  // The native splash is still covering the screen
  if (initializing) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName="(tabs)"
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(screens)/login" />
        <Stack.Screen name="(screens)/processing" />
        <Stack.Screen name="(screens)/preview" />
      </Stack>
    </>
  );
}
