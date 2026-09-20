import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getAuth, signOut } from '@react-native-firebase/auth';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Divider from '@/components/ui/Divider';
import ListRow from '@/components/ui/ListRow';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Typography from '@/components/ui/Typography';
import { colors, layout, spacing } from '@/styles/theme';

const TAB_EDGES = ['top'] as const;
const AVATAR_SIZE = 56;
const IMAGE_FADE_MS = 200;

export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const tabBarHeight = useBottomTabBarHeight();

  const bottomInset = useMemo(() => ({ paddingBottom: tabBarHeight + spacing.lg }), [tabBarHeight]);

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      Alert.alert('Sign out failed', 'Please try again.');
    }
  };

  return (
    <Screen edges={TAB_EDGES}>
      <ScrollView contentContainerStyle={[styles.content, bottomInset]} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Profile" />

        <Card>
          <View style={styles.identity}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatar}
                contentFit="cover"
                transition={IMAGE_FADE_MS}
                accessibilityLabel="Profile photo"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Typography variant="heading" color={colors.accent}>
                  {initial}
                </Typography>
              </View>
            )}
            <View style={styles.identityText}>
              <Typography variant="heading" numberOfLines={1}>
                {user?.displayName || 'Anonymous'}
              </Typography>
              {user?.email ? (
                <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {user.email}
                </Typography>
              ) : null}
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionLabel}>
            Privacy
          </Typography>
          <Card padded={false} style={styles.rows}>
            <ListRow
              icon="phone-portrait-outline"
              title="Tracking runs on your phone"
              subtitle="Videos are analyzed on-device. Nothing is uploaded while a lift is being processed."
            />
            <Divider />
            <ListRow
              icon="cloud-upload-outline"
              title="Only saved lifts are uploaded"
              subtitle="Saving a lift stores the clip and its bar path in your private library."
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionLabel}>
            About
          </Typography>
          <Card padded={false} style={styles.rows}>
            <ListRow icon="logo-google" title="Signed in with Google" />
            <Divider />
            <ListRow
              icon="information-circle-outline"
              title="Version"
              value={Constants.expoConfig?.version ?? '1.0.0'}
            />
          </Card>
        </View>

        <Button label="Sign out" icon="log-out-outline" variant="destructive" fullWidth onPress={handleSignOut} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceRaised,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.xxs,
  },
  rows: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
});
