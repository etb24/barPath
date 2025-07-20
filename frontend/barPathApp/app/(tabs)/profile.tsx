// app/(tabs)/profile.tsx

import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';

export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.avatarContainer}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{user?.displayName || 'Anonymous'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#25292e',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#ffd33d',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius:   50,
    backgroundColor:'#444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd33d',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  email: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 40,
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});