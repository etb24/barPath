import React, { useMemo } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { PathOverlayLayer } from '@/features/tracking/videoOverlay';
import type { Position } from '@/features/tracking/types';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Typography from './ui/Typography';
import VideoTransport from './VideoTransport';
import { playbackSetup, useVideoTransport } from './useVideoTransport';
import { useVideoContentRect } from './useVideoContentRect';
import { colors, layout, radii, spacing } from '@/styles/theme';

export interface LibraryDetailItem {
  url: string;
  liftName: string;
  path: Position[];
  subtitle?: string;
}

interface LibraryDetailModalProps {
  visible: boolean;
  item: LibraryDetailItem | null;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export default function LibraryDetailModal({
  visible,
  item,
  busy,
  onClose,
  onSave,
  onDelete,
  onRename,
}: LibraryDetailModalProps) {
  // Insets come from the app's root SafeAreaProvider rather than a SafeAreaView inside the
  // Modal: the native view inside a Modal intermittently reports zero insets on first layout,
  // which put the close button under the status bar where taps never reach it.
  const insets = useSafeAreaInsets();
  const safeAreaPadding = useMemo(
    () => ({
      paddingTop: Math.max(insets.top, spacing.sm),
      paddingBottom: Math.max(insets.bottom, spacing.sm),
    }),
    [insets.top, insets.bottom],
  );

  // expo-video player; recreated (and setup re-run) when the source url changes
  const player = useVideoPlayer(item?.url ? { uri: item.url } : null, playbackSetup({ loop: true }));
  const transport = useVideoTransport(player);
  const { rect, onLayout } = useVideoContentRect(player);

  if (!visible || !item) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, safeAreaPadding]}>
        <View style={styles.header}>
          <IconButton icon="chevron-down" accessibilityLabel="Close" onPress={onClose} disabled={busy} />
          <View style={styles.titleBlock}>
            <Typography variant="heading" numberOfLines={1} align="center">
              {item.liftName}
            </Typography>
            {item.subtitle ? (
              <Typography variant="caption" color={colors.textMuted} align="center">
                {item.subtitle}
              </Typography>
            ) : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.videoWrap} onLayout={onLayout}>
          <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" />
          <PathOverlayLayer positions={item.path} currentTimeMs={transport.currentTimeMs} rect={rect} />
        </View>

        <VideoTransport transport={transport} />

        <View style={styles.footer}>
          <Button label="Save to Photos" icon="download-outline" fullWidth loading={busy} onPress={onSave} />
          <View style={styles.secondaryRow}>
            <Button
              label="Rename"
              icon="pencil-outline"
              variant="secondary"
              size="md"
              disabled={busy}
              onPress={onRename}
              style={styles.secondaryButton}
            />
            <Button
              label="Delete"
              icon="trash-outline"
              variant="destructive"
              size="md"
              disabled={busy}
              onPress={onDelete}
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  headerSpacer: {
    width: layout.minTouchTarget, // balances the close button so the title sits dead centre
  },
  videoWrap: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.videoBackdrop,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1, // equal widths, so the pair is centred as a unit regardless of label length
  },
});
