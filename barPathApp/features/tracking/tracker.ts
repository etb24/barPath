// On-device barbell path tracker. Port of backend/app/barbell_tracker.py.
// UI-free: takes a video URI, returns the bar path. No React/navigation here.
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import { toByteArray } from 'base64-js';
import type { Position, TrackOptions, TrackResult } from './types';

const MODEL_SIZE = 640; // model input is [1,3,640,640]
const MODEL = require('../../assets/models/barbell-model-v1.2.0.onnx');

interface Detection {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  score: number;
}

interface FrameResult {
  det: Detection | null;
  extractMs: number;
  preprocessMs: number;
  inferMs: number;
}

export class BarbellTracker {
  private session: InferenceSession | null = null;

  async load(): Promise<void> {
    if (this.session) return;
    const asset = Asset.fromModule(MODEL);
    await asset.downloadAsync();
    const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = toByteArray(b64);
    try {
      // CoreML (Neural Engine/GPU) for inference, CPU fallback for unsupported ops
      this.session = await InferenceSession.create(bytes, { executionProviders: ['coreml', 'cpu'] });
    } catch {
      // CoreML EP unavailable for this build/model — plain CPU
      this.session = await InferenceSession.create(bytes);
    }
  }

  async processVideo(uri: string, durationMs: number, opts: TrackOptions = {}): Promise<TrackResult> {
    await this.load();
    const fps = opts.fps ?? 10;
    const threshold = opts.confidenceThreshold ?? 0.5;
    const intervalMs = 1000 / fps;

    // picker duration is sometimes seconds, sometimes ms — normalize
    const ms = durationMs > 0 && durationMs < 1000 ? durationMs * 1000 : durationMs;
    const frameCount = ms > 0 ? Math.min(opts.maxFrames ?? 600, Math.floor(ms / intervalMs)) : 1;

    const positions: Position[] = [];
    let detectedCount = 0;
    const timings = { extractMs: 0, preprocessMs: 0, inferMs: 0 };

    for (let i = 0; i < frameCount; i++) {
      const t = i * intervalMs;
      const r = await this.detectFrame(uri, t);
      timings.extractMs += r.extractMs;
      timings.preprocessMs += r.preprocessMs;
      timings.inferMs += r.inferMs;
      if (r.det && r.det.score >= threshold) {
        positions.push({ t, x: r.det.x, y: r.det.y });
        detectedCount++;
      }
      opts.onProgress?.(i + 1, frameCount);
    }

    return { positions, fps, frameCount, detectedCount, timings };
  }

  private async detectFrame(uri: string, timeMs: number): Promise<FrameResult> {
    const session = this.session!;

    // --- extract ---
    let s = Date.now();
    const thumb = await getThumbnailAsync(uri, { time: timeMs });
    const extractMs = Date.now() - s;

    // --- preprocess (native decode + resize via Skia, then tensor build) ---
    s = Date.now();
    const fail = () => ({ det: null, extractMs, preprocessMs: Date.now() - s, inferMs: 0 });

    const encoded = await Skia.Data.fromURI(thumb.uri);
    const img = Skia.Image.MakeImageFromEncoded(encoded);
    if (!img) return fail();

    // native resize: draw the decoded frame stretched into a 640x640 offscreen surface
    const surface = Skia.Surface.MakeOffscreen(MODEL_SIZE, MODEL_SIZE);
    if (!surface) return fail();
    const canvas = surface.getCanvas();
    canvas.drawImageRect(
      img,
      Skia.XYWHRect(0, 0, img.width(), img.height()),
      Skia.XYWHRect(0, 0, MODEL_SIZE, MODEL_SIZE),
      Skia.Paint(),
    );
    surface.flush();

    const pixels = surface.makeImageSnapshot().readPixels(0, 0, {
      width: MODEL_SIZE,
      height: MODEL_SIZE,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    }) as Uint8Array | null;
    if (!pixels) return fail();

    // normalized NCHW float input: [R-plane, G-plane, B-plane]
    const HW = MODEL_SIZE * MODEL_SIZE;
    const input = new Float32Array(3 * HW);
    for (let p = 0; p < HW; p++) {
      input[p] = pixels[p * 4] / 255;
      input[HW + p] = pixels[p * 4 + 1] / 255;
      input[2 * HW + p] = pixels[p * 4 + 2] / 255;
    }
    const tensor = new Tensor('float32', input, [1, 3, MODEL_SIZE, MODEL_SIZE]);
    const preprocessMs = Date.now() - s;

    // --- inference ---
    s = Date.now();
    const results = await session.run({ [session.inputNames[0]]: tensor });
    const outTensor = results[session.outputNames[0]];
    const out = outTensor.data as Float32Array;
    const shape = outTensor.dims; // [1,5,8400]
    const inferMs = Date.now() - s;

    // parse — handle [1,5,N] or [1,N,5]
    let N: number, score: (a: number) => number, coord: (k: number, a: number) => number;
    if (shape[1] === 5) {
      N = shape[2]; score = (a) => out[4 * N + a]; coord = (k, a) => out[k * N + a];
    } else {
      N = shape[1]; score = (a) => out[a * 5 + 4]; coord = (k, a) => out[a * 5 + k];
    }

    let best = -1, bestScore = 0;
    for (let a = 0; a < N; a++) {
      const sc = score(a);
      if (sc > bestScore) { bestScore = sc; best = a; }
    }
    if (best < 0) return { det: null, extractMs, preprocessMs, inferMs };

    // model already outputs normalized 0-1 box coords (confirmed empirically)
    return { det: { x: coord(0, best), y: coord(1, best), score: bestScore }, extractMs, preprocessMs, inferMs };
  }
}
