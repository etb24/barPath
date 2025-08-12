# Barbell Path Tracker

As a former competitive athlete and fitness enthusiast with a history of injuries, I built a computer vision-powered mobile application that tracks and visualizes barbell movement patterns during weightlifting exercises. It is designed to help athletes improve form, avoid injury, and optimize performance, whether training solo or with a coach.

<img src="demo.gif" width="50%">

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Python, FastAPI
- **Cloud Services**: Firebase (Authentication, Storage, Firestore)
- **Computer Vision**: YOLOv11, OpenCV, PyTorch

## Features

- **Barbell Detection**
  Uses a deep learning model to detect barbells in workout videos

- **Path Visualization**
  Draws a color-coded trail showing the motion of the barbell throughout the lift

- **Mobile App**
  Built with React Native and Expo for cross-platform mobile support

- **Firebase Integration**
  - Secure login via Firebase Authentication
  - Cloud Storage for raw and processed video uploads
  - Firestore for managing video metadata and personal libraries

- **Backend Video Processing**
  - FastAPI microservice retrieves raw videos from Firebase
  - Processes videos using computer vision
  - Saves the processed videos back to Firebase Storage
  - Mobile app downloads and displays the enhanced videos

  ## Potential Future Features

- Real-time video streaming support
- Rep counting and velocity tracking
- Visual dashboard with bar path analytics
- Form scoring and recommendations using pose estimation
- Social sharing and personal progress tracking

## Key Learnings

### Computer Vision

- Integrated OpenCV with YOLOv11 for barbell detection
- Developed frame-by-frame analysis and visual path overlay
- Tuned detection thresholds for optimal accuracy on fitness footage

### Full-Stack Development

- Created REST API using FastAPI for video handling and processing
- Built a mobile interface in React Native with TypeScript
- Handled upload progress, authentication state and result display

### Cloud and Deployment

- Implemented Firebase Authentication and secure storage access
- Used Firestore to manage metadata for user libraries
- Configured CORS and token-based access between mobile and backend

## What Worked Well

- Modular development allowed independent testing of AI, API, and frontend
- Firebase simplified infrastructure management and reduced backend overhead
- Achieved smooth video processing flow from upload to playback
- Developed intuitive UI with clear progress and error feedback

## Planned Improvements

- Add background job orchestration with Firebase functions
- Implement Docker-based deployment pipeline

## Impact

- Developed and deployed a full mobile application powered by computer vision
- Processes real-world videos and provides valuable motion analysis
- Handles real data, users and network variability in production
- Provides a foundation for future fitness-focused computer vision tools