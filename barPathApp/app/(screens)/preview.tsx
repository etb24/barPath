import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, Alert,
  TouchableOpacity, ActivityIndicator, Pressable, Text,
  type LayoutChangeEvent,
} from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {
  ref as storageRef,
  getDownloadURL,
  putFile,
} from '@react-native-firebase/storage';
import {
  collection, doc, setDoc, serverTimestamp,
} from '@react-native-firebase/firestore';
import { auth, storageDb, db } from '../../services/FirebaseConfig';
import { computeContentRect, PathOverlayLayer } from '../../features/tracking/videoOverlay';
import { getHandoff, clearHandoff } from '../../features/tracking/handoff';
import type { Position } from '../../features/tracking/types';
import Screen from '../components/ui/Screen';
import Typography from '../components/ui/Typography';
import { colors, spacing, radii } from '@/styles/theme';

// Firestore doc limit is 1MB; keep the stored path well under it. A short lift at
// 10fps is ~50-200 points, so this only ever trips on unusually long clips.
const MAX_PATH_POINTS = 5000;

function capPath(positions: Position[]): Position[] {
  if (positions.length <= MAX_PATH_POINTS) return positions;
  const step = positions.length / MAX_PATH_POINTS;
  const out: Position[] = [];
  for (let i = 0; i < MAX_PATH_POINTS; i++) out.push(positions[Math.floor(i * step)]);
  return out;
}

export default function PreviewScreen() {
  const { liftName = 'Unknown Lift' } = useLocalSearchParams<{ liftName?: string }>();
  const router = useRouter();
  const user = auth.currentUser!;

  // pull the tracking result handed off by the processing screen
  const handoffRef = useRef(getHandoff());
  const handoff = handoffRef.current;

  const [busy, setBusy] = useState(false);
  // video's true aspect ratio (w/h)
  const [videoAspect, setVideoAspect] = useState(
    handoff?.width && handoff?.height ? handoff.width / handoff.height : 9 / 16,
  );
  const [layout, setLayout] = useState({ w: 0, h: 0 }); // measured content box of the video container
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  // expo-video player; source is stable for the screen's lifetime
  const player = useVideoPlayer({ uri: handoff?.videoUri ?? '' }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.03; // ~30ms, matches the old progressUpdateIntervalMillis
    p.play();
  });

  // play/pause label state, kept in sync by the player itself (also flips when the clip ends)
  const { isPlaying: playing } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // align the overlay to the video's real displayed rect (letterbox-aware)
  const rect = useMemo(
    () => computeContentRect(layout.w, layout.h, videoAspect),
    [layout, videoAspect],
  );

  // drive the overlay off playback time (seconds -> ms)
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setCurrentTimeMs(currentTime * 1000);
  });

  // refine the aspect ratio from the loaded source's video track
  useEventListener(player, 'sourceLoad', ({ availableVideoTracks }) => {
    const size = availableVideoTracks[0]?.size;
    if (size?.width && size?.height) setVideoAspect(size.width / size.height);
  });

  // release the handoff when leaving the preview
  useEffect(() => clearHandoff, []);

  // no tracking data error handling
  useEffect(() => {
    if (!handoff) {
      Alert.alert('Nothing to preview', 'Please pick a video to analyze.');
      router.replace('/(tabs)');
    }
  }, [handoff]);

  if (!handoff) return null;

  const onVideoLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) setLayout({ w: width, h: height });
  };

  const togglePlay = () => {
    if (player.playing) { player.pause(); return; }
    // if at/near the end, restart from the beginning (replay)
    if (player.duration && player.currentTime >= player.duration - 0.1) {
      player.currentTime = 0;
    }
    player.play();
  };

  const saveToLibrary = async () => {
    setBusy(true);
    try {
      const videoId = Date.now().toString();

      // upload the original video
      const videoBlobPath = `${user.uid}/videos/${videoId}.mp4`;
      await putFile(storageRef(storageDb, videoBlobPath), handoff.videoUri);

      // thumbnail from the original clip
      const { uri: thumbLocalUri } = await VideoThumbnails.getThumbnailAsync(
        handoff.videoUri,
        { time: 1000, quality: 0.5 },
      );
      const thumbPath = `${user.uid}/thumbs/${videoId}.jpg`;
      const thumbRef = storageRef(storageDb, thumbPath);
      await putFile(thumbRef, thumbLocalUri);
      const thumbnailUrl = await getDownloadURL(thumbRef);

      // write metadata + the bar path itself directly to Firestore (no server)
      const videosCol = collection(db, 'users', user.uid, 'videos');
      await setDoc(doc(videosCol, videoId), {
        liftName,
        videoBlobPath,
        thumbnailUrl,
        fps: handoff.fps,
        frameCount: handoff.frameCount,
        path: capPath(handoff.positions),
        createdAt: serverTimestamp(),
      });

      Alert.alert('Saved', 'Video added to your library.');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy(false);
    }
  };

  // nothing is uploaded until save, so discarding just leaves the screen
  const discard = () => router.replace('/(tabs)');

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.videoOuter}>
          <View style={[styles.videoInner, { aspectRatio: videoAspect }]} onLayout={onVideoLayout}>
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              nativeControls={false}
              contentFit="contain"
            />
            <PathOverlayLayer
              positions={handoff.positions}
              currentTimeMs={currentTimeMs}
              rect={rect}
            />
          </View>
        </View>

        <Pressable
          onPress={togglePlay}
          style={styles.playButton}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
        >
          <Text style={styles.playText}>{playing ? 'Pause' : 'Play'}</Text>
        </Pressable>

        <View style={styles.saveRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveToLibrary}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color={colors.background} />
              : <Typography variant="subtitle" weight="bold" color={colors.background}>
                  Save to Library
                </Typography>}
          </TouchableOpacity>
        </View>

        <View style={styles.discardRow}>
          <TouchableOpacity
            style={[styles.button, styles.discardButton]}
            onPress={discard}
            disabled={busy}
          >
            <Typography variant="subtitle" weight="bold" color={colors.textPrimary}>
              Discard
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  // any framing stays on the OUTER wrapper so the measured inner box is the exact video content rect (a border here would offset/scale the overlay)
  videoOuter: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.md,
  },
  videoInner: {
    width: '100%',
    position: 'relative',
  },
  playButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  playText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  discardRow: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent,
    width: '100%',
  },
  discardButton: {
    backgroundColor: colors.destructive,
    width: '40%',
  },
});
