import React from 'react';
import { ScrollView, View, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii, shadow } from '../styles/theme';

export default function ProfileScreen() {
  const auth = getAuth();
  const router = useRouter();
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

  const goToLibrary = () => router.push('/library');
  const goToUpload  = () => router.push('/upload');

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pill label="Profile" tone="accent" uppercase />
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

          <Card tone="secondary" style={styles.statsCard}>
            <Typography variant="subtitle" weight="bold" color={colors.textSecondary}>
              Training stats coming soon
            </Typography>
            <Typography variant="body" color={colors.textMuted} style={styles.statsCopy}>
              We’re building deeper analytics so you can track volume, consistency, and streaks right from here.
            </Typography>
          </Card>
        </View>

        <View style={styles.section}>
          <Typography variant="subtitle" weight="bold" color={colors.textSecondary}>
            Quick actions
          </Typography>
          <Card tone="secondary" padded={false} style={styles.cardList}>
            <ProfileRow title="Upload a lift" subtitle="Pick a video to analyze" onPress={goToUpload} />
            <ProfileRow title="Your library" subtitle="Manage saved videos" onPress={goToLibrary} />
          </Card>
        </View>

        <View style={styles.section}>
          <Typography variant="subtitle" weight="bold" color={colors.textSecondary}>
            About
          </Typography>
          <Card tone="secondary" padded={false} style={styles.aboutCard}>
            <InfoRow label="App" value="barPath.io" />
            <View style={styles.divider} />
            <InfoRow label="Version" value="1.0.0" />
          </Card>
        </View>

        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
          android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
          onPress={handleSignOut}
        >
          <Typography variant="subtitle" weight="bold" color={colors.textPrimary}>
            Sign out
          </Typography>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

// might delete this component later
function ProfileRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
      style={({ pressed }) => [rowStyles.row, pressed && rowStyles.pressed]}
    >
      <View style={rowStyles.texts}>
        <Typography variant="subtitle" weight="bold">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color={colors.textMuted} style={rowStyles.subtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <Typography variant="title" color={colors.textMuted}>
        ›
      </Typography>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.aboutRow}>
      <Typography variant="caption" color={colors.textMuted}>
        {label}
      </Typography>
      <Typography variant="body" color={colors.textSecondary}>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.lg,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: colors.accent,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: {
    gap: spacing.xs,
  },
  statsCard: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  statsCopy: {
    lineHeight: 20,
  },
  section: {
    gap: spacing.md,
  },
  cardList: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  aboutCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  aboutRow: {
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  signOutButton: {
    alignSelf: 'center',
    backgroundColor: colors.destructive,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    ...shadow.card,
  },
  signOutPressed: {
    transform: [{ scale: 0.97 }],
  },
});

const rowStyles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pressed: { transform: [{ scale: 0.99 }] },
  texts: { flex: 1, paddingRight: 12 },
  subtitle: { marginTop: spacing.xs },
});
