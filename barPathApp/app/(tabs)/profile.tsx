import React from 'react';
import { ScrollView, View, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import Screen from '../components/ui/Screen';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii } from '@/styles/theme';

export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;

  const initial =
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Typography variant="hero" weight="black">
                {initial}
              </Typography>
            </View>
          )}

          <View style={styles.identityText}>
            <Typography variant="title" weight="black">
              {user?.displayName || 'Anonymous'}
            </Typography>
            {user?.email ? (
              <Typography variant="body" color={colors.textSecondary}>
                {user.email}
              </Typography>
            ) : null}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
          android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={handleSignOut}
        >
          <Typography variant="subtitle" weight="bold" color={colors.textPrimary}>
            Sign out
          </Typography>
        </Pressable>

        <Typography variant="caption" color={colors.textMuted} style={styles.version}>
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Typography>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: {
    gap: spacing.xs,
  },
  signOutButton: {
    alignSelf: 'center',
    backgroundColor: colors.destructive,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  signOutPressed: {
    transform: [{ scale: 0.97 }],
  },
  version: {
    textAlign: 'center',
  },
});
