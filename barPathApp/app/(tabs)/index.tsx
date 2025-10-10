import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Platform, LayoutAnimation, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';
import QuickAction from '../components/QuickAction';
import Accordion from '../components/Accordion';
import Bullet from '../components/Bullet';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii } from '../styles/theme';

// enable layout animation on Android (for accordion)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const router = useRouter();
  const auth   = getAuth();
  const user   = auth.currentUser;

  const goToUpload  = () => router.push('/upload');
  const goToLibrary = () => router.push('/library');
  const goToProfile = () => router.push('/profile'); // change this route for future a patch notes


  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Pill label="barPath.io" tone="accent" uppercase />
          <Typography variant="hero" weight="black" style={styles.heroTitle}>
            Track a sharper bar path.
          </Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.heroCopy}>
            Analyze every lift with AI overlays, actionable cues, and a clean history of your best sets.
          </Typography>
          <View style={styles.heroActions}>
            <QuickAction
              title="Upload a lift"
              subtitle="Pick a video to analyze"
              icon="upload"
              onPress={goToUpload}
            />
          </View>
        </View>

        <Card style={styles.quickCard}>
          <Typography variant="subtitle" weight="bold" color={colors.textSecondary}>
            Jump back in
          </Typography>
          <View style={styles.quickRow}>
            <QuickAction
              title="Your library"
              subtitle="Review saved videos"
              icon="folder"
              onPress={goToLibrary}
            />
            <QuickAction
              title="What’s new"
              subtitle="See latest updates"
              icon="zap"
              onPress={goToProfile} // replace with actual "what's new" route when available
            />
          </View>
        </Card>

        <Card tone="secondary" style={styles.infoCard}>
          <Typography variant="subtitle" weight="bold" style={styles.sectionHeading}>
            Nail the bar path every time
          </Typography>
          <Typography variant="body" color={colors.textMuted} style={styles.sectionBody}>
            Follow these quick tips to get clean, high-contrast footage so our tracker can stay on the barbell.
          </Typography>

          <Accordion
            title="How to get the best results"
            defaultOpen
            containerStyle={styles.accordion}
            headerStyle={styles.accordionHeader}
            titleStyle={styles.accordionTitle}
            chevronStyle={styles.accordionChevron}
            bodyStyle={styles.accordionBody}
          >
            <Bullet text="Record from the side with the lifter centered and the camera steady." />
            <Bullet text="Keep the barbell, plates, and feet fully in frame for the complete set." />
            <Bullet text="Use bright, even lighting and avoid motion blur or heavy compression." />
            <Bullet text="Trim your clip close to the set to speed up upload and processing." />
            <Bullet text="Review the preview and save to your library to track progress over time." />
          </Accordion>

          <Accordion
            title="Troubleshooting & tips"
            containerStyle={styles.accordion}
            headerStyle={styles.accordionHeader}
            titleStyle={styles.accordionTitle}
            chevronStyle={styles.accordionChevron}
            bodyStyle={styles.accordionBody}
          >
            <Bullet text="If tracking slips, try a higher angle or remove clutter around the bar." />
            <Bullet text="Higher frame rates (60 fps) give cleaner tracking on fast pulls." />
            <Bullet text="Grant photo/video permissions so the uploader can access your library." />
            <Bullet text="Videos stay private to your account until you delete them." />
          </Accordion>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  heroTitle: {
    marginTop: spacing.md,
  },
  heroCopy: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  heroActions: {
    marginTop: spacing.lg,
  },
  quickCard: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  infoCard: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeading: {
    color: colors.textPrimary,
  },
  sectionBody: {
    lineHeight: 22,
  },
  accordion: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  accordionHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  accordionBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  accordionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  accordionChevron: {
    color: colors.textMuted,
  },
});
