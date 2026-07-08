/*One-shot in-memory handoff of a tracking result from the processing screen to
the preview screen. The flow is linear (processing does router.replace('/preview')),
so a single-slot module store is simpler and cheaper than serializing a large
positions[] array through navigation params.*/
import type { Position } from './types';

export interface TrackHandoff {
  videoUri: string;      // local URI of the ORIGINAL picked video
  liftName: string;
  positions: Position[]; // normalized 0-1 bar-center path
  fps: number;
  frameCount: number;
  width: number;         // original video pixel dimensions (for aspect ratio)
  height: number;
}

let current: TrackHandoff | null = null;

export function setHandoff(handoff: TrackHandoff): void {
  current = handoff;
}

export function getHandoff(): TrackHandoff | null {
  return current;
}

export function clearHandoff(): void {
  current = null;
}
