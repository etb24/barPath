import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Haptics from 'expo-haptics';
import { ref as storageRef, getDownloadURL, putFile } from '@react-native-firebase/storage';
import { collection, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { auth, storageDb, db } from '@/services/FirebaseConfig';
import { PathOverlayLayer } from '@/features/tracking/videoOverlay';
import { getHandoff, clearHandoff } from '@/features/tracking/handoff';
import type { Position } from '@/features/tracking/types';
import VideoTransport from '@/components/VideoTransport';
import { playbackSetup, useVideoTransport } from '@/components/useVideoTransport';
import { useVideoContentRect } from '@/components/useVideoContentRect';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Screen from '@/components/ui/Screen';
import Typography from '@/components/ui/Typography';
import { colors, layout, radii, spacing, typography } from '@/styles/theme';

// Firestore doc limit is 1MB; keep the stored path well under it. A short lift at
// 10fps is ~50-200 points, so this only ever trips on unusually long clips.
const MAX_PATH_POINTS = 5000;
const DEFAULT_LIFT_NAME = 'My Lift';
const MAX_NAME_LENGTH = 40;
const THUMBNAIL_TIME_MS = 1000;
const THUMBNAIL_QUALITY = 0.5;

function capPath(positions: Position[]): Position[] {
  if (positions.length <= MAX_PATH_POINTS) return positions;
  const step = positions.length / MAX_PATH_POINTS;
  return Array.from({ length: MAX_PATH_POINTS }, (_, i) => positions[Math.floor(i * step)]);
}

export default function PreviewScreen() {
  const { liftName = DEFAULT_LIFT_NAME } = useLocalSearchParams<{ liftName?: string }>();
  const router = useRouter();
  const user = auth.currentUser;

  // pull the tracking result handed off by the processing screen
  const handoffRef = useRef(getHandoff());
  const handoff = handoffRef.current;

  const [name, setName] = useState(liftName);
  const [busy, setBusy] = useState(false);

  // expo-video player; source is stable for the screen's lifetime
  const player = useVideoPlayer({ uri: handoff?.videoUri ?? '' }, playbackSetup({ loop: false }));
  const transport = useVideoTransport(player);
  const { rect, onLayout } = useVideoContentRect(
    player,
    handoff?.width && handoff?.height ? handoff.width / handoff.height : undefined,
  );

  // release the handoff when leaving the preview
  useEffect(() => clearHandoff, []);

  useEffect(() => {
    if (!handoff) {
      Alert.alert('Nothing to preview', 'Please pick a video to analyze.');
      router.replace('/(tabs)');
    }
  }, [handoff, router]);

  if (!handoff) return null;

  const saveToLibrary = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in again to save this lift.');
      return;
    }
    const finalName = name.trim() || DEFAULT_LIFT_NAME;
    setBusy(true);
    try {
      const videoId = Date.now().toString();

      // upload the original video
      const videoBlobPath = `${user.uid}/videos/${videoId}.mp4`;
      await putFile(storageRef(storageDb, videoBlobPath), handoff.videoUri);

      // thumbnail from the original clip
      const { uri: thumbLocalUri } = await VideoThumbnails.getThumbnailAsync(handoff.videoUri, {
        time: THUMBNAIL_TIME_MS,
        quality: THUMBNAIL_QUALITY,
      });
      const thumbRef = storageRef(storageDb, `${user.uid}/thumbs/${videoId}.jpg`);
      await putFile(thumbRef, thumbLocalUri);
      const thumbnailUrl = await getDownloadURL(thumbRef);

      // write metadata + the bar path itself directly to Firestore (no server)
      const videosCol = collection(db, 'users', user.uid, 'videos');
      await setDoc(doc(videosCol, videoId), {
        liftName: finalName,
        videoBlobPath,
        thumbnailUrl,
        fps: handoff.fps,
        frameCount: handoff.frameCount,
        path: capPath(handoff.positions),
        createdAt: serverTimestamp(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      Alert.alert('Saved', `“${finalName}” was added to your library.`);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // nothing is uploaded until save, so discarding just leaves the screen, but the user
  // did wait for processing, so confirm before throwing that work away
  const discard = () => {
    Alert.alert('Discard this lift?', 'The video and its bar path will not be saved.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" accessibilityLabel="Discard and go back" onPress={discard} disabled={busy} />
          <Typography variant="heading">Preview</Typography>
          <View style={styles.headerSpacer} />
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name this lift"
          placeholderTextColor={colors.textMuted}
          maxLength={MAX_NAME_LENGTH}
          returnKeyType="done"
          autoCapitalize="words"
          editable={!busy}
          accessibilityLabel="Lift name"
          style={styles.nameInput}
        />

        <View style={styles.videoWrap} onLayout={onLayout}>
          <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="contain" />
          <PathOverlayLayer positions={handoff.positions} currentTimeMs={transport.currentTimeMs} rect={rect} />
        </View>

        <VideoTransport transport={transport} />

        <View style={styles.footer}>
          <Button label="Save to library" icon="checkmark-circle" fullWidth loading={busy} onPress={saveToLibrary} />
          <Button label="Discard" variant="ghost" size="md" disabled={busy} onPress={discard} style={styles.discard} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  headerSpacer: {
    width: layout.minTouchTarget,
  },
  nameInput: {
    ...typography.heading,
    color: colors.textPrimary,
    height: layout.controlHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // The video letterboxes inside this flexible box; useVideoContentRect keeps the overlay
  // glued to the pixels actually showing video, whatever size the box ends up.
  videoWrap: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.videoBackdrop,
  },
  footer: {
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  discard: {
    alignSelf: 'center',
  },
});
