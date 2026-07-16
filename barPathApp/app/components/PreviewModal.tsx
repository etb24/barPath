import React, { useMemo, useState } from 'react';
import { useEventListener } from 'expo';
import {
  Modal, View, TouchableOpacity, ActivityIndicator, StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { computeContentRect, PathOverlayLayer } from '../../features/tracking/videoOverlay';
import type { Position } from '../../features/tracking/types';
import Typography from './ui/Typography';
import { colors, spacing, radii } from '@/styles/theme';

export default function LibraryModal({
  visible,
  item,
  busy,
  onClose,
  onSave,
  onDelete,
  onRename,
}: {
  visible: boolean;
  item: { url: string; liftName: string; path: Position[] } | null;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [videoAspect, setVideoAspect] = useState(9 / 16);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const rectangle = useMemo(
    () => computeContentRect(layout.w, layout.h, videoAspect),
    [layout, videoAspect],
  );

  // expo-video player; recreated (and setup re-run) when the source url changes
  const player = useVideoPlayer(item?.url ? { uri: item.url } : null, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.03; // ~30ms, matches the old progressUpdateIntervalMillis
    p.play();
  });

  // drive the overlay off playback time (seconds -> ms)
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setCurrentTimeMs(currentTime * 1000);
  });

  // true video aspect ratio, from the loaded source's video track
  useEventListener(player, 'sourceLoad', ({ availableVideoTracks }) => {
    const size = availableVideoTracks[0]?.size;
    if (size?.width && size?.height) setVideoAspect(size.width / size.height);
  });

  if (!visible || !item) {
    return null;
  }

  const onVideoLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setLayout({ w: width, h: height });
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>

          <View style={styles.videoWrap} onLayout={onVideoLayout}>
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              nativeControls
              contentFit="contain"
            />
            <PathOverlayLayer positions={item.path} currentTimeMs={currentTimeMs} rect={rectangle} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={onRename}>
              <Typography variant="subtitle" weight="bold" style={styles.title}>
                {item.liftName}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onSave}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Ionicons name="download" size={24} color={colors.textPrimary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.deleteButton]}
              onPress={onDelete}
              disabled={busy}
            >
              <Ionicons name="trash" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.closeButton]}
              onPress={onClose}
              disabled={busy}
            >
              <Ionicons name="close" size={24} color={colors.background} />
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
  },
  videoWrap: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  controlButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  deleteButton: {
    backgroundColor: colors.destructive,
  },
  closeButton: {
    backgroundColor: colors.textPrimary,
  },
});
