import { useCallback, useRef, useState } from 'react';
import { useEvent, useEventListener } from 'expo';
import type { VideoPlayer } from 'expo-video';

const TIME_UPDATE_INTERVAL_S = 0.03; // ~30ms keeps the bar-path overlay in step with playback
const REPLAY_THRESHOLD_S = 0.1; // pressing play this close to the end restarts the clip

// Shared player setup for every lift video. Playback is muted by default: the audio is gym
// noise, and dropping it removes a whole control from the UI.
export function playbackSetup({ loop }: { loop: boolean }) {
  return (player: VideoPlayer) => {
    player.loop = loop;
    player.muted = true;
    player.timeUpdateEventInterval = TIME_UPDATE_INTERVAL_S;
    player.play();
  };
}

export interface VideoTransport {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  togglePlay: () => void;
  seekTo: (ms: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}

// Play/pause + position state for a player, driven by the player's own events so it stays
// correct when the clip ends or loops on its own.
export function useVideoTransport(player: VideoPlayer): VideoTransport {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const wasPlayingBeforeScrub = useRef(false);

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setCurrentTimeMs(currentTime * 1000);
  });

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    if (duration > 0) setDurationMs(duration * 1000);
  });

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
      return;
    }
    if (player.duration && player.currentTime >= player.duration - REPLAY_THRESHOLD_S) {
      player.currentTime = 0;
    }
    player.play();
  }, [player]);

  const seekTo = useCallback(
    (ms: number) => {
      player.currentTime = ms / 1000;
      setCurrentTimeMs(ms); // keep the overlay in step even while paused
    },
    [player],
  );

  const onScrubStart = useCallback(() => {
    wasPlayingBeforeScrub.current = player.playing;
    player.pause();
  }, [player]);

  const onScrubEnd = useCallback(() => {
    if (wasPlayingBeforeScrub.current) player.play();
  }, [player]);

  return { isPlaying, currentTimeMs, durationMs, togglePlay, seekTo, onScrubStart, onScrubEnd };
}
