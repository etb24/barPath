import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';

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
    const inProtectedRoute = ['processing', 'preview'].includes(segments[0]);

    if (user && !inAuthGroup && !inProtectedRoute) {
      //user is signed in but not in tabs or protected route, redirect to tabs
      router.replace('/(tabs)');
    } else if (!user && (inAuthGroup || inProtectedRoute)) {
      //user is not signed in but trying to access protected routes
      router.replace('/login');
    }
  }, [user, initializing, segments]);

  // Show loading screen while checking auth
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#25292e' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="processing" 
        options={{ 
          headerShown: false,
          gestureEnabled: false //prevent swipe back during processing
        }} 
      />
      <Stack.Screen name="preview" options={{ headerShown: false }}/>
    </Stack>
  );
}