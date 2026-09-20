import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarbellTracker } from '@/features/tracking/tracker';
import { setHandoff } from '@/features/tracking/handoff';
import ProgressRing from '@/components/ui/ProgressRing';
import Screen from '@/components/ui/Screen';
import Typography from '@/components/ui/Typography';
import { colors, layout, spacing } from '@/styles/theme';

const DEFAULT_LIFT_NAME = 'My Lift';
const SAMPLE_FPS = 10;

interface FrameProgress {
  done: number;
  total: number;
}

export default function ProcessingScreen() {
  const { inputUri, liftName, duration, width, height } = useLocalSearchParams<{
    inputUri: string;
    liftName?: string;
    duration?: string;
    width?: string;
    height?: string;
  }>();
  const router = useRouter();

  const [frames, setFrames] = useState<FrameProgress>({ done: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tracker = new BarbellTracker();
        const result = await tracker.processVideo(inputUri, Number(duration) || 0, {
          fps: SAMPLE_FPS,
          onProgress: (done, total) => {
            if (!cancelled && total > 0) setFrames({ done, total });
          },
        });
        if (cancelled) return;

        // hand the path off to the preview screen (positions[] is too bulky for params)
        setHandoff({
          videoUri: inputUri,
          liftName: liftName ?? DEFAULT_LIFT_NAME,
          positions: result.positions,
          fps: result.fps,
          frameCount: result.frameCount,
          width: Number(width) || 0,
          height: Number(height) || 0,
        });

        router.replace({ pathname: '/preview', params: { liftName: liftName ?? DEFAULT_LIFT_NAME } });
      } catch (error: unknown) {
        if (cancelled) return;
        Alert.alert('Processing failed', error instanceof Error ? error.message : 'Unknown error');
        router.replace('/');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once for the video passed in via params
  }, []);

  const progress = frames.total > 0 ? frames.done / frames.total : 0;
  const percentage = Math.round(progress * 100);
  const status = frames.total > 0 ? `Frame ${frames.done} of ${frames.total}` : 'Warming up the detector…';

  return (
    <Screen>
      <View style={styles.container}>
        <ProgressRing value={progress} accessibilityLabel="Tracking progress">
          <Typography variant="display" align="center" style={styles.percent}>
            {percentage}%
          </Typography>
        </ProgressRing>

        <View style={styles.copy}>
          <Typography variant="heading" align="center">
            Tracking the bar
          </Typography>
          <Typography variant="body" color={colors.textSecondary} align="center" accessibilityLiveRegion="polite">
            {status}
          </Typography>
        </View>

        <Typography variant="caption" color={colors.textMuted} align="center">
          This runs entirely on your phone. Keep the app open until it finishes.
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: layout.screenPadding + spacing.md,
  },
  copy: {
    gap: spacing.xxs,
  },
  percent: {
    fontVariant: ['tabular-nums'],
  },
});
