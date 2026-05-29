// THROWAWAY spike screen — pick a video, track it on-device, play it with the bar-path overlay.
// Delete with the rest of the spike scaffolding once the real preview screen exists.
import React, { useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { BarbellTracker } from '../../features/tracking/tracker';
import { PathOverlay } from '../../features/tracking/PathOverlay';
import type { Position } from '../../features/tracking/types';

const MAX_W = 260;

export default function SpikeOverlay() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [box, setBox] = useState({ w: MAX_W, h: Math.round((MAX_W * 16) / 9) });
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('Pick a video to track + overlay');
  const videoRef = useRef<Video>(null);

  const run = async () => {
    setBusy(true);
    setStatus('opening picker...');
    setPositions([]);
    setVideoUri(null);
    setPlaying(false);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
      if (picked.canceled || !picked.assets[0]) { setStatus('cancelled'); return; }
      const asset = picked.assets[0];

      // size the display box to the video's aspect ratio so the overlay aligns with the frame
      const aspect = asset.width && asset.height ? asset.width / asset.height : 9 / 16;
      setBox({ w: MAX_W, h: Math.round(MAX_W / aspect) });
      setVideoUri(asset.uri);

      setStatus('tracking...');
      const tracker = new BarbellTracker();
      const result = await tracker.processVideo(asset.uri, asset.duration ?? 0, {
        fps: 10,
        onProgress: (d, t) => setStatus(`tracking ${d}/${t}`),
      });
      setPositions(result.positions);
      setStatus(`tracked ${result.positions.length} points — press play`);
    } catch (e) {
      setStatus(`error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    // if at/near the end, restart from the beginning (replay)
    const s = await v.getStatusAsync();
    if (s.isLoaded && s.durationMillis && s.positionMillis >= s.durationMillis - 100) {
      await v.setPositionAsync(0);
    }
    setPlaying(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.c}>
      <Pressable onPress={run} disabled={busy} style={styles.btn}>
        <Text style={styles.btnText}>{busy ? 'Working…' : 'Pick + track + overlay'}</Text>
      </Pressable>
      <Text style={styles.status}>{status}</Text>
      {busy && <ActivityIndicator style={{ marginVertical: 8 }} />}
      {videoUri && (
        <View style={{ width: box.w, height: box.h, alignSelf: 'center' }}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={{ width: box.w, height: box.h }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={playing}
            progressUpdateIntervalMillis={30}
            onPlaybackStatusUpdate={(s: AVPlaybackStatus) => {
              if (s.isLoaded) {
                setCurrentTimeMs(s.positionMillis);
                if (s.didJustFinish) setPlaying(false);
              }
            }}
          />
          {positions.length > 0 && (
            <PathOverlay positions={positions} currentTimeMs={currentTimeMs} width={box.w} height={box.h} />
          )}
        </View>
      )}
      {videoUri && (
        <Pressable onPress={togglePlay} style={styles.btn}>
          <Text style={styles.btnText}>{playing ? '❚❚ Pause' : '▶ Play'}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { padding: 20, paddingTop: 80, paddingBottom: 60, gap: 10 },
  btn: { backgroundColor: '#222', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  status: { fontFamily: 'Courier', fontSize: 13 },
});
