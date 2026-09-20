import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const PRESSED_SCALE = 0.97;
const PRESS_IN_MS = 90;
const PRESS_OUT_MS = 160;

// Shared "squish" feedback for pressable surfaces. It runs on the UI thread via
// Reanimated, so it stays smooth even when the JS thread is busy (mid-upload, mid-bake).
export function usePressScale(pressedScale: number = PRESSED_SCALE) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withTiming(pressedScale, { duration: PRESS_IN_MS });
  }, [scale, pressedScale]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: PRESS_OUT_MS });
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
