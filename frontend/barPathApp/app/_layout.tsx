import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { auth, onAuthStateChanged } from '../services/FirebaseConfig';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // subscribe once
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inTabs = segments[0] === '(tabs)';
    const inProtectedRoute = ['processing','preview'].includes(segments[0]);

    if (user && !inTabs && !inProtectedRoute) {
      router.replace('/(tabs)');
    } else if (!user && (inTabs || inProtectedRoute)) {
      router.replace('/login');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style = {{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#25292e'}}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // disable edge-swipe everywhere
      }}
      initialRouteName="(tabs)" // start in tabs by default
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="processing" />
      <Stack.Screen name="preview" />
    </Stack>
  );
}