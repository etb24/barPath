import React, { useState } from 'react';
import { View, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import * as VideoPicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii, shadow } from '../styles/theme';

export default function HomeScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const [opening, setOpening] = useState(false);

  const pickAndProcess = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }
    try {
      setOpening(true);
      const result = await VideoPicker.launchImageLibraryAsync({
        mediaTypes: VideoPicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      router.push({
        pathname: '/processing',
        params: {
          inputUri: result.assets[0].uri,
          liftName: 'My Lift',
        },
      });
    } finally {
      setOpening(false);
    }
  };

  return (
    <Screen>
      <View style={styles.wrapper}>
        <Pill label="Upload" tone="accent" uppercase />
        <Typography variant="hero" weight="black" style={styles.title}>
          Import a lift for analysis
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Choose a recent set and we’ll highlight the bar path, velocity, and range with AI overlays.
        </Typography>

        <Card style={styles.card} testID="upload-card" accessibilityRole="summary">
          <View style={styles.cardHeader}>
            <Typography variant="subtitle" weight="bold">
              Pick a video
            </Typography>
            <Typography variant="caption" color={colors.textMuted}>
              Under 2 minutes keeps processing snappy.
            </Typography>
          </View>

          <Pressable
            onPress={pickAndProcess}
            disabled={opening}
            android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
            accessibilityRole="button"
            accessibilityLabel={opening ? 'Opening video library' : 'Upload Video'}
            testID="pick-process-button"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              opening && styles.buttonDisabled,
            ]}
          >
            <View style={styles.buttonInner}>
              {opening && (
                <ActivityIndicator size="small" color="#101114" style={styles.spinner} />
              )}
              <Typography variant="subtitle" weight="bold" color={colors.background}>
                {opening ? 'Opening…' : 'Upload video'}
              </Typography>
            </View>
          </Pressable>

          <View style={styles.tipGroup}>
            <Typography variant="caption" color={colors.textMuted}>
              Tips for clean tracking
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.hint}>
              Keep the lifter centered, light the scene well, and avoid slow motion clips.
            </Typography>
          </View>
        </Card>

        <Card tone="secondary" padded={false} style={styles.noteCard}>
          <View style={styles.noteRow}>
            <Typography variant="caption" color={colors.textMuted}>
              Privacy
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.footerNote}>
              Videos stay private to your account. Delete them anytime from your library.
            </Typography>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    marginTop: spacing.sm,
  },
  card: {
    gap: spacing.lg,
  },
  cardHeader: {
    gap: spacing.xs,
  },
  subtitle: {
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  spinner: {
    marginRight: spacing.xs,
  },
  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  tipGroup: {
    gap: spacing.xs,
  },
  hint: {
    lineHeight: 20,
  },
  footerNote: {
    lineHeight: 20,
  },
  noteCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.lg,
  },
  noteRow: {
    gap: spacing.xs,
  },
});
