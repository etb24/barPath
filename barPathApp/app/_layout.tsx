import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { auth, onAuthStateChanged } from '../services/FirebaseConfig'; // or "@/services/FirebaseConfig"
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const root = (segments[0] ?? '') as string; // "(tabs)" | "(screens)" | ""
    const leaf = ((segments[segments.length - 1] ?? '') as string).toLowerCase(); // "index" | "login" | "processing" | "preview" ...

    const inTabs = root === '(tabs)';
    const isLogin = leaf === 'login';
    const inProtected = ['processing', 'preview'].includes(leaf);

    if (user) {
      if (isLogin) router.replace('/');
    } else {
      if (inTabs || inProtected) router.replace('/login');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#121212' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, gestureEnabled: false }}
      initialRouteName="(tabs)"
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(screens)/login" />
      <Stack.Screen name="(screens)/processing" />
      <Stack.Screen name="(screens)/preview" />
    </Stack>
  );
}