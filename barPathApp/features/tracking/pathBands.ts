// Single source of truth for the bar-path trail shape/colors
import type { Position } from './types';

export const BANDS = 24; // color steps along the trail

export interface Band {
  start: number; // index into positions (segment start)
  end: number; // index into positions (segment end, inclusive)
  frac: number; // 0 = oldest (black) .. 1 = newest (red)
}

// The trail grows to the points visible by `currentTimeMs`, split into ~BANDS short sub-paths that share boundary points (no gaps)
// Oldest band = black, newest = red, so the leading edge stays red as the trail grows.
export function computeBands(positions: Position[], currentTimeMs: number): Band[] {
  'worklet';
  let visible = 0;
  while (visible < positions.length && positions[visible].t <= currentTimeMs) visible++;
  if (visible < 2) return [];

  const lastSeg = visible - 1; // segments connect points 0..lastSeg
  const perBand = Math.ceil(lastSeg / BANDS);
  const numBands = Math.ceil(lastSeg / perBand);

  const out: Band[] = [];
  let b = 0;
  for (let startIdx = 0; startIdx < lastSeg; startIdx += perBand) {
    const endIdx = Math.min(lastSeg, startIdx + perBand); // shared boundary => no gaps
    const frac = numBands > 1 ? b / (numBands - 1) : 1;
    out.push({ start: startIdx, end: endIdx, frac });
    b++;
  }
  return out;
}

// stroke color for a band: oldest (frac 0) = black, newest (frac 1) = red
export function bandColor(frac: number): string {
  'worklet';
  return `rgb(${Math.round(255 * frac)},0,0)`;
}
