import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getAuth } from '@react-native-firebase/auth';
import Button, { type IconName } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Divider from '@/components/ui/Divider';
import ListRow from '@/components/ui/ListRow';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Typography from '@/components/ui/Typography';
import { colors, layout, spacing } from '@/styles/theme';

const DEFAULT_LIFT_NAME = 'My Lift';
const TAB_EDGES = ['top'] as const;

interface Tip {
  icon: IconName;
  title: string;
  detail: string;
}

const TIPS: readonly Tip[] = [
  {
    icon: 'phone-portrait-outline',
    title: 'Film from the side',
    detail: 'A side-on angle at hip height shows the bar’s real forward and backward drift.',
  },
  {
    icon: 'scan-outline',
    title: 'Keep the bar in frame',
    detail: 'Leave room above and below the full range of the rep so the detector never loses it.',
  },
  {
    icon: 'body-outline',
    title: 'Prop the phone up',
    detail: 'A steady camera gives a clean trace. Handheld footage adds wobble to the path.',
  },
];

export default function TrackScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [opening, setOpening] = useState(false);

  const bottomInset = useMemo(() => ({ paddingBottom: tabBarHeight + spacing.lg }), [tabBarHeight]);

  const pickVideo = async () => {
    if (!getAuth().currentUser) {
      Alert.alert('Sign in required', 'Please sign in before tracking a lift.');
      return;
    }
    try {
      setOpening(true);
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
      if (result.canceled || !result.assets[0]?.uri) return;
      const asset = result.assets[0];

      router.push({
        pathname: '/processing',
        params: {
          inputUri: asset.uri,
          liftName: DEFAULT_LIFT_NAME,
          // the on-device tracker needs duration to compute frame count;
          // dimensions drive the overlay's aspect ratio on preview
          duration: String(asset.duration ?? 0),
          width: String(asset.width ?? 0),
          height: String(asset.height ?? 0),
        },
      });
    } catch (error: unknown) {
      Alert.alert('Couldn’t open your videos', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Screen edges={TAB_EDGES}>
      <ScrollView contentContainerStyle={[styles.content, bottomInset]} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Track a lift" subtitle="Pick a video and we’ll trace the bar." />

        <Card style={styles.hero}>
          <View style={styles.heroCopy}>
            <Typography variant="heading">Your bar path, frame by frame</Typography>
            <Typography variant="body" color={colors.textSecondary}>
              Detection runs on your phone. Nothing is uploaded until you choose to save.
            </Typography>
          </View>
          <Button
            label="Choose a video"
            icon="videocam"
            fullWidth
            loading={opening}
            onPress={pickVideo}
            testID="pick-process-button"
          />
        </Card>

        <View style={styles.section}>
          <Typography variant="label" color={colors.textMuted} style={styles.sectionLabel}>
            For a clean trace
          </Typography>
          <Card padded={false} style={styles.rows}>
            {TIPS.map((tip, index) => (
              <React.Fragment key={tip.title}>
                {index > 0 ? <Divider /> : null}
                <ListRow icon={tip.icon} title={tip.title} subtitle={tip.detail} />
              </React.Fragment>
            ))}
          </Card>
        </View>
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
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroCopy: {
    gap: spacing.xs,
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
