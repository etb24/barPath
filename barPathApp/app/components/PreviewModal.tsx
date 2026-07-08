import React, { useMemo, useState } from 'react';
import {
  Modal, View, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView,
  type LayoutChangeEvent,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus, type VideoReadyForDisplayEvent } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { computeContentRect, PathOverlayLayer } from '../../features/tracking/videoOverlay';
import type { Position } from '../../features/tracking/types';
import Typography from './ui/Typography';
import { colors, spacing, radii } from '../styles/theme';

export default function libraryModal({
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
            <Video
              source={{ uri: item.url }}
              style={StyleSheet.absoluteFill}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              progressUpdateIntervalMillis={30}
              onReadyForDisplay={(e: VideoReadyForDisplayEvent) => {
                const { width, height } = e.naturalSize;
                if (width && height) setVideoAspect(width / height);
              }}
              onPlaybackStatusUpdate={(s: AVPlaybackStatus) => {
                if (s.isLoaded) setCurrentTimeMs(s.positionMillis);
              }}
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
