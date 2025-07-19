import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  function handleAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    console.log('Auth state changed:', user?.email || 'No user');
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    return subscriber;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (user && !inAuthGroup) {
      // User is signed in but not in tabs, redirect to tabs
      router.replace('/(tabs)');
    } else if (!user && inAuthGroup) {
      // User is not signed in but in tabs, redirect to login
      router.replace('/login');
    }
  }, [user, initializing, segments]);

  if (initializing) return null;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}