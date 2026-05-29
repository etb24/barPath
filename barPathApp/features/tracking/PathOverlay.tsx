import React, { useMemo } from 'react';
import { Canvas, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import type { Position } from './types';

const BANDS = 24; // color steps along the trail

interface PathOverlayProps {
  positions: Position[];
  currentTimeMs: number; // trail is drawn up to here
  width: number; // canvas size in px (matches the video's displayed rect)
  height: number;
  strokeWidth?: number;
}
// (recomputed as currentTimeMs advances), so the leading edge stays red as the trail grows.
// Rendered as ~BANDS short sub-paths so it's cheap (the per-segment version reconciled ~60 elements and lagged). Positions are normalized 0-1, scaled to the canvas here.
export function PathOverlay({ positions, currentTimeMs, width, height, strokeWidth = 2.5 }: PathOverlayProps) {
  const bands = useMemo<{ path: SkPath; color: string }[]>(() => {
    // visible prefix (positions are time-ordered)
    let visible = 0;
    while (visible < positions.length && positions[visible].t <= currentTimeMs) visible++;
    if (visible < 2) return [];

    const lastSeg = visible - 1; // segments connect points 0..lastSeg
    const perBand = Math.ceil(lastSeg / BANDS);
    const numBands = Math.ceil(lastSeg / perBand);

    const out: { path: SkPath; color: string }[] = [];
    let b = 0;
    for (let startIdx = 0; startIdx < lastSeg; startIdx += perBand) {
      const endIdx = Math.min(lastSeg, startIdx + perBand); // shared boundary point => no gaps
      const path = Skia.Path.Make();
      path.moveTo(positions[startIdx].x * width, positions[startIdx].y * height);
      for (let i = startIdx + 1; i <= endIdx; i++) {
        path.lineTo(positions[i].x * width, positions[i].y * height);
      }
      // oldest band (b=0) = black, newest band = red
      const frac = numBands > 1 ? b / (numBands - 1) : 1;
      out.push({ path, color: `rgb(${Math.round(255 * frac)},0,0)` });
      b++;
    }
    return out;
  }, [positions, currentTimeMs, width, height]);

  return (
    <Canvas pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
      {bands.map((band, i) => (
        <Path
          key={i}
          path={band.path}
          color={band.color}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          strokeJoin="round"
        />
      ))}
    </Canvas>
  );
}
