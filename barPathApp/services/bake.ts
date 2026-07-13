// On-device bake: burn the bar path into a shareable MP4 using the phone's own hardware video encoder
// The drawn trail is produced by the same band math as the in-app Skia overlay (features/tracking/pathBands)
import * as FileSystem from 'expo-file-system';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { Platform } from 'react-native';
import {
  Skia,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
  type SkImage,
} from '@shopify/react-native-skia';
import {
  exportVideoComposition,
  getValidEncoderConfigurations,
  type FrameDrawer,
  type VideoComposition,
} from '@azzapp/react-native-skia-video';
import { computeBands, bandColor } from '../features/tracking/pathBands';
import type { Position } from '../features/tracking/types';

const MAX_DIMENSION = 1920; // cap the long side so 4K source clips still encode fast
const EXPORT_FPS = 30;

// the native encoder / frame extractor want plain filesystem paths, not file:// URIs
const stripScheme = (uri: string) => uri.replace(/^file:\/\//, '');

export interface BakeInput {
  videoId: string;
  sourceUrl: string; // remote download URL of the ORIGINAL clip
  positions: Position[]; // normalized 0-1 bar path
  fps: number; // sampling fps used during tracking
  frameCount: number; // number of sampled frames
}

// Returns a local file:// URI to the baked MP4.
export async function bakeVideo({
  videoId,
  sourceUrl,
  positions,
  fps,
  frameCount,
}: BakeInput): Promise<string> {
  const bakedPath = `${FileSystem.cacheDirectory}${videoId}_baked.mp4`;

  // reuse a previous local bake if it's still cached (avoid re-encoding)
  const cached = await FileSystem.getInfoAsync(bakedPath);
  if (cached.exists) return bakedPath;

  // pull the original down once — skia-video only reads local files
  const localSrc = `${FileSystem.cacheDirectory}${videoId}_src.mp4`;
  const srcInfo = await FileSystem.getInfoAsync(localSrc);
  if (!srcInfo.exists) {
    const res = await FileSystem.downloadAsync(sourceUrl, localSrc);
    if (res.status !== 200) throw new Error(`Download failed (${res.status})`);
  }

  // probe the upright frame size from a thumbnail (decoded natively by Skia)
  const { width: srcW, height: srcH } = await probeSize(localSrc);

  const durationSec =
    fps > 0 && frameCount > 0
      ? frameCount / fps
      : positions.length
        ? positions[positions.length - 1].t / 1000 + 0.1
        : 1;

  // preserve aspect, cap the long side, keep dims even for the encoder
  const { width, height } = fitExportSize(srcW, srcH);

  const composition: VideoComposition = {
    duration: durationSec,
    items: [
      {
        id: 'main',
        path: stripScheme(localSrc),
        compositionStartTime: 0,
        startTime: 0,
        duration: durationSec,
      },
    ],
  };

  const drawFrame: FrameDrawer = ({ canvas, currentTime, frames, width: w, height: h }) => {
    'worklet';
    // draw the source frame, upright, covering the canvas
    const frame = frames.main;
    if (frame) {
      let image: SkImage | null = null;
      try {
        image = Skia.Image.MakeImageFromNativeTextureUnstable(
          frame.texture,
          frame.width,
          frame.height,
        );
      } catch {
        image = null;
      }
      if (image) {
        const rot = frame.rotation || 0;
        const swap = rot === 90 || rot === 270;
        const uw = swap ? frame.height : frame.width; // upright dims
        const uh = swap ? frame.width : frame.height;
        const scale = Math.max(w / uw, h / uh); // cover
        canvas.save();
        canvas.translate(w / 2, h / 2);
        canvas.scale(scale, scale);
        canvas.rotate(rot, 0, 0);
        canvas.translate(-frame.width / 2, -frame.height / 2);
        canvas.drawImage(image, 0, 0);
        canvas.restore();
      }
    }

    // grow the trail to the points visible at this timestamp
    const paint = Skia.Paint();
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(Math.max(2.5, w * 0.006));
    paint.setStrokeCap(StrokeCap.Round);
    paint.setStrokeJoin(StrokeJoin.Round);
    paint.setAntiAlias(true);

    const bands = computeBands(positions, currentTime * 1000);
    for (let bi = 0; bi < bands.length; bi++) {
      const { start, end, frac } = bands[bi];
      const path = Skia.Path.Make();
      path.moveTo(positions[start].x * w, positions[start].y * h);
      for (let i = start + 1; i <= end; i++) {
        path.lineTo(positions[i].x * w, positions[i].y * h);
      }
      paint.setColor(Skia.Color(bandColor(frac)));
      canvas.drawPath(path, paint);
    }
  };

  // On Android the requested config must be validated against the device's encoder; iOS takes the requested config directly.
  const outPath = stripScheme(bakedPath);
  const bitRate = Math.min(12_000_000, Math.round(width * height * EXPORT_FPS * 0.12));
  const requested = { width, height, frameRate: EXPORT_FPS, bitRate };
  const config =
    Platform.OS === 'android'
      ? (getValidEncoderConfigurations(width, height, EXPORT_FPS, bitRate)?.[0] ?? requested)
      : requested;

  await exportVideoComposition({
    videoComposition: composition,
    drawFrame,
    ...config,
    outPath,
  });

  return bakedPath;
}

// decode one frame to read the video's upright pixel dimensions.
async function probeSize(localUri: string): Promise<{ width: number; height: number }> {
  const { uri } = await getThumbnailAsync(localUri, { time: 0 });
  const data = await Skia.Data.fromURI(uri);
  const img = Skia.Image.MakeImageFromEncoded(data);
  if (!img) return { width: 1080, height: 1920 }; // sensible portrait fallback
  return { width: img.width(), height: img.height() };
}

function fitExportSize(w: number, h: number): { width: number; height: number } {
  let ow = w;
  let oh = h;
  const longest = Math.max(w, h);
  if (longest > MAX_DIMENSION) {
    const s = MAX_DIMENSION / longest;
    ow = w * s;
    oh = h * s;
  }
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  return { width: even(ow), height: even(oh) };
}
