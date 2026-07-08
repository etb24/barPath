// Shared helpers for aligning the bar-path overlay to a video's displayed rect
// video rect inside its container. Used by both the preview and library screens
import React from 'react';
import { View } from 'react-native';
import { PathOverlay } from './PathOverlay';
import type { Position } from './types';

export interface ContentRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Given a container's measured size and the video's true aspect (w/h), return the
// rect the CONTAIN-fitted video actually occupies (accounting for letter/pillarbox)
export function computeContentRect(cw: number, ch: number, aspect: number): ContentRect {
  if (!cw || !ch || !aspect) return { x: 0, y: 0, w: 0, h: 0 };
  const containerAspect = cw / ch;
  if (containerAspect > aspect) {
    const dw = ch * aspect; // pillarboxed: bars left/right
    return { x: (cw - dw) / 2, y: 0, w: dw, h: ch };
  }
  const dh = cw / aspect; // letterboxed: bars top/bottom
  return { x: 0, y: (ch - dh) / 2, w: cw, h: dh };
}

export function PathOverlayLayer({
  positions,
  currentTimeMs,
  rect,
}: {
  positions: Position[];
  currentTimeMs: number;
  rect: ContentRect;
}) {
  if (rect.w <= 0 || positions.length === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <PathOverlay positions={positions} currentTimeMs={currentTimeMs} width={rect.w} height={rect.h} />
    </View>
  );
}
