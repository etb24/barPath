import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useEventListener } from 'expo';
import type { VideoPlayer } from 'expo-video';
import { computeContentRect, type ContentRect } from '@/features/tracking/videoOverlay';

const DEFAULT_ASPECT = 9 / 16; // portrait phone footage until the real track dimensions arrive

interface VideoContentRect {
  rect: ContentRect; // where the CONTAIN-fitted video actually sits inside the measured box
  onLayout: (event: LayoutChangeEvent) => void; // attach to the video's container
}

// Keeps the bar-path overlay glued to the pixels that show video, whatever size the container
// ends up and however the clip is letterboxed inside it.
export function useVideoContentRect(player: VideoPlayer, initialAspect?: number): VideoContentRect {
  const [aspect, setAspect] = useState(initialAspect && initialAspect > 0 ? initialAspect : DEFAULT_ASPECT);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // refine the aspect ratio from the loaded source's video track
  useEventListener(player, 'sourceLoad', ({ availableVideoTracks }) => {
    const trackSize = availableVideoTracks[0]?.size;
    if (trackSize?.width && trackSize?.height) setAspect(trackSize.width / trackSize.height);
  });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) setSize({ w: width, h: height });
  }, []);

  const rect = useMemo(() => computeContentRect(size.w, size.h, aspect), [size, aspect]);

  return { rect, onLayout };
}
