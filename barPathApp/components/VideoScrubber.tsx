import React, { useCallback, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Typography from './ui/Typography';
import { colors, radii, spacing } from '@/styles/theme';

interface VideoScrubberProps {
  positionMs: number;
  durationMs: number;
  // Called on tap, while dragging (throttled), and once more on release
  onSeek: (ms: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const TOUCH_HEIGHT = 32;
const SEEK_THROTTLE_MS = 80;
const A11Y_STEP = 0.05;
const A11Y_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface LiveState {
  trackWidth: number;
  durationMs: number;
  onSeek: VideoScrubberProps['onSeek'];
  onScrubStart?: VideoScrubberProps['onScrubStart'];
  onScrubEnd?: VideoScrubberProps['onScrubEnd'];
  startFraction: number;
  lastSeekAt: number;
}

export default function VideoScrubber({
  positionMs,
  durationMs,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: VideoScrubberProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  // While the finger is down the thumb follows it, not playback, so seeking never fights the drag
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);

  // The PanResponder is created once, so it reads live props through a ref instead of stale closures
  const live = useRef<LiveState>({
    trackWidth: 0,
    durationMs: 0,
    onSeek,
    onScrubStart,
    onScrubEnd,
    startFraction: 0,
    lastSeekAt: 0,
  });
  live.current.trackWidth = trackWidth;
  live.current.durationMs = durationMs;
  live.current.onSeek = onSeek;
  live.current.onScrubStart = onScrubStart;
  live.current.onScrubEnd = onScrubEnd;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const state = live.current;
        const fraction = state.trackWidth > 0 ? clamp01(event.nativeEvent.locationX / state.trackWidth) : 0;
        state.startFraction = fraction;
        state.lastSeekAt = Date.now();
        setScrubFraction(fraction);
        state.onScrubStart?.();
        state.onSeek(fraction * state.durationMs);
      },
      onPanResponderMove: (_event, gesture) => {
        const state = live.current;
        if (state.trackWidth <= 0) return;
        const fraction = clamp01(state.startFraction + gesture.dx / state.trackWidth);
        setScrubFraction(fraction);
        const now = Date.now();
        if (now - state.lastSeekAt >= SEEK_THROTTLE_MS) {
          state.lastSeekAt = now;
          state.onSeek(fraction * state.durationMs);
        }
      },
      onPanResponderRelease: (_event, gesture) => {
        const state = live.current;
        const fraction =
          state.trackWidth > 0 ? clamp01(state.startFraction + gesture.dx / state.trackWidth) : state.startFraction;
        state.onSeek(fraction * state.durationMs);
        setScrubFraction(null);
        state.onScrubEnd?.();
      },
      onPanResponderTerminate: () => {
        setScrubFraction(null);
        live.current.onScrubEnd?.();
      },
    }),
  ).current;

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  // VoiceOver / TalkBack "adjustable" controls seek in 5% steps with swipe up/down
  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (durationMs <= 0) return;
      const { actionName } = event.nativeEvent;
      const delta = actionName === 'increment' ? A11Y_STEP : actionName === 'decrement' ? -A11Y_STEP : 0;
      if (delta !== 0) onSeek(clamp01(positionMs / durationMs + delta) * durationMs);
    },
    [durationMs, onSeek, positionMs],
  );

  const playedFraction = durationMs > 0 ? clamp01(positionMs / durationMs) : 0;
  const fraction = scrubFraction ?? playedFraction;
  const shownMs = scrubFraction != null ? scrubFraction * durationMs : positionMs;
  const isScrubbing = scrubFraction != null;

  return (
    <View style={styles.row}>
      <Typography variant="caption" color={colors.textSecondary} style={styles.time}>
        {formatClock(shownMs)}
      </Typography>
      <View
        {...responder.panHandlers}
        onLayout={onTrackLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100), text: formatClock(shownMs) }}
        accessibilityActions={A11Y_ACTIONS}
        onAccessibilityAction={onAccessibilityAction}
        style={styles.touchArea}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
        </View>
        <View
          style={[
            styles.thumb,
            { left: fraction * trackWidth - THUMB_SIZE / 2 },
            isScrubbing && styles.thumbActive,
          ]}
        />
      </View>
      <Typography variant="caption" color={colors.textSecondary} align="right" style={styles.time}>
        {formatClock(durationMs)}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  time: {
    minWidth: 40,
    fontVariant: ['tabular-nums'],
  },
  touchArea: {
    flex: 1,
    height: TOUCH_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.accent,
  },
  thumbActive: {
    transform: [{ scale: 1.3 }],
  },
});
