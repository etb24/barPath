import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarbellTracker } from '../../features/tracking/tracker';
import { setHandoff } from '../../features/tracking/handoff';
import Screen from '../components/ui/Screen';
import Typography from '../components/ui/Typography';
import { colors, spacing } from '@/styles/theme';

export default function ProcessingScreen() {
  const { inputUri, liftName, duration, width, height } = useLocalSearchParams<{
    inputUri: string;
    liftName?: string;
    duration?: string;
    width?: string;
    height?: string;
  }>();
  const router = useRouter();

  const [progress, setProgress] = useState(0); // 0-1

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tracker = new BarbellTracker();
        const result = await tracker.processVideo(inputUri, Number(duration) || 0, {
          fps: 10,
          onProgress: (done, total) => {
            if (!cancelled && total > 0) setProgress(done / total);
          },
        });
        if (cancelled) return;

        // hand the path off to the preview screen (positions[] is too bulky for params)
        setHandoff({
          videoUri: inputUri,
          liftName: liftName ?? 'My Lift',
          positions: result.positions,
          fps: result.fps,
          frameCount: result.frameCount,
          width: Number(width) || 0,
          height: Number(height) || 0,
        });

        router.replace({ pathname: '/preview', params: { liftName: liftName ?? 'My Lift' } });
      } catch (e: any) {
        if (cancelled) return;
        Alert.alert('Processing failed', e?.message || 'Unknown error');
        router.replace('/');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const percentage = Math.round(progress * 100);

  return (
    <Screen>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Typography variant="subtitle" weight="bold" style={styles.title}>
          Processing…
        </Typography>
        {percentage > 0 && (
          <Typography variant="body" color={colors.textSecondary} style={styles.copy}>
            {percentage}%
          </Typography>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
