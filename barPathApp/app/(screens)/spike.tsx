// THROWAWAY spike screen — frame-extraction benchmark + one-shot inference test (ONNX Runtime).
// Delete this file (and the temporary button in upload.tsx) once the spike is done.
import React, { useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { decode as jpegDecode } from 'jpeg-js';
import { toByteArray } from 'base64-js';
import { BarbellTracker } from '../../features/tracking/tracker';

const FPS = 60;
const INTERVAL_MS = 1000 / FPS;
const MAX_FRAMES = 600;
const SIZE = 640; // model input side

const MODEL = require('../../assets/models/barbell-model-v1.2.0.onnx');

export default function Spike() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const append = (line: string) => setLog((prev) => [...prev, line]);

  const pickVideo = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (picked.canceled || !picked.assets[0]) return null;
    return picked.assets[0];
  };

  const runBenchmark = async () => {
    setLog([]);
    setRunning(true);
    try {
      const asset = await pickVideo();
      if (!asset) { append('Cancelled.'); return; }
      const raw = asset.duration ?? 0;
      const durationMs = raw > 0 && raw < 1000 ? raw * 1000 : raw;
      const frameCount = durationMs > 0 ? Math.min(MAX_FRAMES, Math.floor(durationMs / INTERVAL_MS)) : 150;
      append(`extracting ${frameCount} frames @ ${FPS}fps...`);
      const start = Date.now();
      let ok = 0;
      for (let i = 0; i < frameCount; i++) {
        try { await getThumbnailAsync(asset.uri, { time: i * INTERVAL_MS }); ok++; } catch {}
      }
      const perFrame = ok > 0 ? (Date.now() - start) / ok : 0;
      append(`avg: ${perFrame.toFixed(0)} ms/frame`);
      append(`=> ~${((perFrame * FPS * 60) / 1000).toFixed(0)}s per 60s of video @ ${FPS}fps`);
    } finally {
      setRunning(false);
    }
  };

  const runInference = async () => {
    setLog([]);
    setRunning(true);
    try {
      // 3a — load ONNX model (as a byte buffer, avoids file:// path quirks) and log specs
      append('loading model...');
      const asset = Asset.fromModule(MODEL);
      await asset.downloadAsync();
      const b64 = await FileSystem.readAsStringAsync(asset.localUri!, { encoding: FileSystem.EncodingType.Base64 });
      let session: InferenceSession;
      try {
        session = await InferenceSession.create(toByteArray(b64), { executionProviders: ['coreml', 'cpu'] });
        append('EP: coreml');
      } catch {
        session = await InferenceSession.create(toByteArray(b64));
        append('EP: cpu (coreml unavailable)');
      }
      append(`inputs:  ${session.inputNames.join(', ')}`);
      append(`outputs: ${session.outputNames.join(', ')}`);

      // 3b — grab one frame
      const video = await pickVideo();
      if (!video) { append('Cancelled.'); return; }
      const thumb = await getThumbnailAsync(video.uri, { time: 0 });

      // resize to SIZExSIZE (stretch — spike simplification; real pipeline should letterbox)
      const resized = await ImageManipulator.manipulateAsync(
        thumb.uri,
        [{ resize: { width: SIZE, height: SIZE } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );
      if (!resized.base64) { append('no base64 from resize'); return; }

      // decode JPEG -> RGBA pixels
      const { data } = jpegDecode(toByteArray(resized.base64), { useTArray: true });

      // build normalized NCHW float input: [R-plane, G-plane, B-plane] (ONNX is channels-first)
      const HW = SIZE * SIZE;
      const input = new Float32Array(3 * HW);
      for (let p = 0; p < HW; p++) {
        input[p] = data[p * 4] / 255;          // channel 0: R
        input[HW + p] = data[p * 4 + 1] / 255;  // channel 1: G
        input[2 * HW + p] = data[p * 4 + 2] / 255; // channel 2: B
      }
      const inputTensor = new Tensor('float32', input, [1, 3, SIZE, SIZE]);

      // run
      const t0 = Date.now();
      const feeds = { [session.inputNames[0]]: inputTensor };
      const results = await session.run(feeds);
      const outTensor = results[session.outputNames[0]];
      const out = outTensor.data as Float32Array;
      const shape = outTensor.dims; // expected [1,5,8400]
      append(`inference: ${Date.now() - t0} ms, output dims=[${shape}]`);

      // parse — handle [1,5,N] or [1,N,5] layout
      let N: number, score: (a: number) => number, coord: (k: number, a: number) => number;
      if (shape[1] === 5) {
        N = shape[2]; score = (a) => out[4 * N + a]; coord = (k, a) => out[k * N + a];
      } else {
        N = shape[1]; score = (a) => out[a * 5 + 4]; coord = (k, a) => out[a * 5 + k];
      }
      let best = -1, bestScore = 0;
      for (let a = 0; a < N; a++) { const s = score(a); if (s > bestScore) { bestScore = s; best = a; } }

      append('--- RESULT ---');
      if (best < 0) { append('no detections'); return; }
      append(`best score: ${bestScore.toFixed(3)}`);
      append(`box (cx,cy,w,h): ${coord(0, best).toFixed(1)}, ${coord(1, best).toFixed(1)}, ${coord(2, best).toFixed(1)}, ${coord(3, best).toFixed(1)}`);
      append(bestScore > 0.5 ? 'VERDICT: barbell detected — pipeline works' : 'VERDICT: ran, but low confidence — check preprocessing/coords');
    } catch (e) {
      append(`ERROR: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const runFullTrack = async () => {
    setLog([]);
    setRunning(true);
    try {
      const video = await pickVideo();
      if (!video) { append('Cancelled.'); return; }
      append('loading model + tracking full video...');
      const tracker = new BarbellTracker();
      const start = Date.now();
      const result = await tracker.processVideo(video.uri, video.duration ?? 0, {
        fps: 10,
        onProgress: (done, total) => { if (done % 20 === 0) append(`  ${done}/${total}`); },
      });
      const secs = ((Date.now() - start) / 1000).toFixed(1);
      const n = result.frameCount || 1;
      const { extractMs, preprocessMs, inferMs } = result.timings;
      append('--- RESULT ---');
      append(`processed ${result.frameCount} frames in ${secs}s`);
      append(`detected: ${result.detectedCount}/${result.frameCount}`);
      append(`per-frame: extract ${(extractMs / n).toFixed(0)} | preprocess ${(preprocessMs / n).toFixed(0)} | infer ${(inferMs / n).toFixed(0)} ms`);
      if (result.positions.length) {
        const first = result.positions[0];
        const last = result.positions[result.positions.length - 1];
        append(`first: t=${first.t} x=${first.x.toFixed(3)} y=${first.y.toFixed(3)}`);
        append(`last:  t=${last.t} x=${last.x.toFixed(3)} y=${last.y.toFixed(3)}`);
      }
    } catch (e) {
      append(`ERROR: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>On-device ML spike (ONNX)</Text>
      <Pressable onPress={runBenchmark} disabled={running} style={styles.button}>
        <Text style={styles.buttonText}>{running ? 'Running…' : '1. Frame benchmark'}</Text>
      </Pressable>
      <Pressable onPress={runInference} disabled={running} style={styles.button}>
        <Text style={styles.buttonText}>{running ? 'Running…' : '2. Inference test'}</Text>
      </Pressable>
      <Pressable onPress={runFullTrack} disabled={running} style={styles.button}>
        <Text style={styles.buttonText}>{running ? 'Running…' : '3. Track full video'}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/spike-overlay' as any)} disabled={running} style={styles.button}>
        <Text style={styles.buttonText}>4. Track + show overlay →</Text>
      </Pressable>
      {log.map((line, i) => (
        <Text key={i} style={styles.logLine}>{line}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, gap: 6 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  button: { backgroundColor: '#222', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  logLine: { fontFamily: 'Courier', fontSize: 13 },
});
