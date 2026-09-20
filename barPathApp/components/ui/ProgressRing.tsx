import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/styles/theme';

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
  accessibilityLabel?: string;
  // Rendered centred inside the ring (the percentage, a caption)
  children?: React.ReactNode;
}

const DEFAULT_SIZE = 200;
const DEFAULT_STROKE = 12;
const FILL_MS = 350;
const START_ANGLE = -90; // twelve o'clock
const FULL_SWEEP = 360;

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

export default function ProgressRing({
  value,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE,
  accessibilityLabel = 'Progress',
  children,
}: ProgressRingProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(clamp01(value));

  // Progress arrives in discrete per-frame jumps; easing between them reads as steady motion
  useEffect(() => {
    const next = clamp01(value);
    progress.value = reduceMotion
      ? next
      : withTiming(next, { duration: FILL_MS, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion, value]);

  // One full circle, inset by half the stroke so round caps stay inside the canvas.
  // The fill is the same path trimmed by `end`, so track and fill always line up.
  const ringPath = useMemo(() => {
    const inset = strokeWidth / 2;
    const path = Skia.Path.Make();
    path.addArc({ x: inset, y: inset, width: size - strokeWidth, height: size - strokeWidth }, START_ANGLE, FULL_SWEEP);
    return path;
  }, [size, strokeWidth]);

  const canvasStyle = useMemo(() => ({ width: size, height: size }), [size]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(value) * 100) }}
      style={canvasStyle}
    >
      <Canvas style={canvasStyle} pointerEvents="none">
        <Path path={ringPath} color={colors.surfaceRaised} style="stroke" strokeWidth={strokeWidth} />
        <Path
          path={ringPath}
          color={colors.accent}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          start={0}
          end={progress}
        />
      </Canvas>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
