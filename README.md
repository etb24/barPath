# Barbell Path Tracker

As a former competitive athlete and fitness enthusiast with a history of injuries, I built a computer vision-powered mobile application that tracks and visualizes barbell movement patterns during weightlifting exercises. It is designed to help athletes improve form, avoid injury, and optimize performance, whether training solo or with a coach.

<img src="demo.gif" width="50%">

## Tech Stack

- **App**: React Native, Expo, TypeScript, Expo Router
- **On-Device ML**: ONNX Runtime, YOLOv11-derived barbell detection model
- **Cloud Services**: Firebase (Authentication, Firestore, Storage)

## Features

- **On-Device Barbell Detection**
  Runs a deep learning model locally with ONNX Runtime to find the barbell frame by frame — no server round-trip, no upload wait

- **Path Visualization**
  Draws a color-coded trail showing the motion of the barbell throughout the lift, rendered with Skia

- **Shareable Exports**
  Bakes the path overlay into an MP4 on-device using Skia and the native video encoder

- **Personal Library**
  Secure login via Firebase Authentication, with Firestore and Cloud Storage managing each user's video library

## How It Works

1. Pick or record a lift video in the app
2. The tracker decodes frames and runs barbell detection locally
3. The path is drawn as a live overlay during playback
4. Optionally, the overlay is baked into a new MP4 for saving or sharing

## Architecture Evolution

The first version processed videos in the cloud: the app uploaded raw footage to Firebase Storage, a FastAPI service pulled it down, ran YOLOv11 + OpenCV, and wrote the processed video back for the app to download.

It worked, but every lift meant uploading a full video, waiting on a server, and downloading the result. Moving inference on-device (ONNX Runtime + Skia) makes analysis faster, works offline, keeps footage private and eliminates server costs. The FastAPI service remains in `backend/` as the reference implementation the on-device tracker was ported from.

## Running the App

```bash
cd barPathApp
npm install
npx expo run:ios       # or: npx expo run:android
```

## Potential Future Features

- Rep counting and velocity tracking
- Visual dashboard with bar path analytics
- Form scoring and recommendations using pose estimation
- Social sharing and personal progress tracking
- App Store / Google Play release

## Key Learnings

### Computer Vision & On-Device ML

- Ported a Python/OpenCV tracking pipeline to TypeScript running on ONNX Runtime
- Developed frame-by-frame analysis and visual path overlay with Skia
- Tuned detection thresholds for optimal accuracy on fitness footage

### Mobile Development

- Built a cross-platform app with React Native, Expo Router, and TypeScript
- Worked with native modules, custom dev builds, and the React Native New Architecture
- Handled video decoding, playback, and on-device MP4 export

### Cloud & Architecture

- Designed and shipped a full cloud-processing pipeline (FastAPI + Firebase), then migrated it on-device
- Implemented Firebase Authentication and secure, per-user storage access
- Learned the trade-offs between server-side and edge inference: latency, cost, privacy, and offline support
