export interface Position {
  t: number; // timestamp in ms
  x: number; // bar-center X, normalized 0-1 (relative to frame width)
  y: number; // bar-center Y, normalized 0-1 (relative to frame height)
}

export interface TrackOptions {
  fps?: number; // sample rate (default 10)
  confidenceThreshold?: number; // default 0.5
  maxFrames?: number; // safety cap (default 600)
  onProgress?: (done: number, total: number) => void;
}

export interface TrackResult {
  positions: Position[];
  fps: number;
  frameCount: number;
  detectedCount: number;
  // total ms spent in each stage across all frames (for profiling)
  timings: { extractMs: number; preprocessMs: number; inferMs: number };
}
