import React, { useMemo } from 'react';
import { Canvas, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import type { Position } from './types';
import { computeBands, bandColor } from './pathBands';

interface PathOverlayProps {
  positions: Position[];
  currentTimeMs: number; // trail is drawn up to here
  width: number; // canvas size in px (matches the video's displayed rect)
  height: number;
  strokeWidth?: number;
}
// Trail band math lives in ./pathBands (shared with the video exporter)
// Here we turn each band's index range into a Skia sub-path scaled to the canvas
// Rendered as ~BANDS short sub-paths so it's cheap (the per-segment version reconciled ~60 elements and lagged)
export function PathOverlay({ positions, currentTimeMs, width, height, strokeWidth = 2.5 }: PathOverlayProps) {
  const bands = useMemo<{ path: SkPath; color: string }[]>(() => {
    return computeBands(positions, currentTimeMs).map(({ start, end, frac }) => {
      const path = Skia.Path.Make();
      path.moveTo(positions[start].x * width, positions[start].y * height);
      for (let i = start + 1; i <= end; i++) {
        path.lineTo(positions[i].x * width, positions[i].y * height);
      }
      return { path, color: bandColor(frac) };
    });
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
