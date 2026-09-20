import React from 'react';
import { StyleSheet, View } from 'react-native';
import IconButton from './ui/IconButton';
import VideoScrubber from './VideoScrubber';
import type { VideoTransport as VideoTransportState } from './useVideoTransport';
import { spacing } from '@/styles/theme';

interface VideoTransportProps {
  transport: VideoTransportState;
  disabled?: boolean;
}

// The one set of playback controls used everywhere a lift video appears
export default function VideoTransport({ transport, disabled = false }: VideoTransportProps) {
  const { isPlaying, currentTimeMs, durationMs, togglePlay, seekTo, onScrubStart, onScrubEnd } = transport;

  return (
    <View style={styles.row}>
      <IconButton
        icon={isPlaying ? 'pause' : 'play'}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        variant="filled"
        disabled={disabled}
        onPress={togglePlay}
      />
      <View style={styles.scrubber}>
        <VideoScrubber
          positionMs={currentTimeMs}
          durationMs={durationMs}
          onSeek={seekTo}
          onScrubStart={onScrubStart}
          onScrubEnd={onScrubEnd}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrubber: {
    flex: 1,
  },
});
