import cv2
import numpy as np
from ultralytics import YOLO
from collections import deque
import os
from io import BytesIO
import tempfile

PALETTE_START = np.array([0, 0, 255], dtype=np.float32)  # red
PALETTE_END = np.array([0, 0, 0], dtype=np.float32)    # black

class BarbellPathTracker:
    def __init__(self, model_path, confidence_threshold=0.5, max_path_length=1000):
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        self.max_path_length = max_path_length
    
    
    def _process_frame(self, frame, positions, draw_box=False,):
        # run detection
        results = self.model(frame)
        
        # extract barbell position if detected
        current_detection = None
        if len(results) > 0 and len(results[0].boxes) > 0:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()
            best_idx = np.argmax(confidences)
            if confidences[best_idx] > self.confidence_threshold:
                box = boxes[best_idx]
                cx = int((box[0] + box[2]) / 2)
                cy = int((box[1] + box[3]) / 2)
                positions.append((cx, cy))
                current_detection = box

        display_positions = positions

        # draw path
        if len(display_positions) > 1:
            pts = np.array(list(display_positions), dtype=np.int32)
            for i in range(1, len(pts)):
                t = i / (len(pts) - 1)
                color = (PALETTE_END * (1 - t) + PALETTE_START * t).astype(int)
                thickness = 2
                cv2.line(
                    frame,
                    tuple(pts[i - 1]),
                    tuple(pts[i]),
                    tuple(color.tolist()),
                    thickness
                )
        
        # draw bounding box if enabled
        if draw_box and current_detection is not None:
            x1, y1, x2, y2 = map(int, current_detection)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                frame, "Barbell", (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2
            )
        
        # frame counter
        cv2.putText(
            frame, f"Points: {len(positions)}", (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2
        )
        
        return frame
    
    def process_video(self, video_path, output_path, draw_box=False,):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"success": False, "message": "Could not open video file"}
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        ret, first_frame = cap.read()
        if not ret:
            cap.release()
            return {"success": False, "message": "Could not read video"}
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

        fh, fw = first_frame.shape[:2]
        needs_rotation = (width > height and fh > fw) or (width < height and fw > fh)
        out_w = height if needs_rotation else width
        out_h = width if needs_rotation else height
        
        out_dir = os.path.dirname(output_path)
        if out_dir and not os.path.exists(out_dir):
            os.makedirs(out_dir, exist_ok=True)
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (out_w, out_h))
        if not out.isOpened():
            cap.release()
            return {"success": False, "message": "Could not create output video"}
        
        positions = deque(maxlen=self.max_path_length)
        frames = 0
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                if needs_rotation:
                    frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                
                frame = self._process_frame(frame, positions, draw_box,)
                out.write(frame)
                
                frames += 1
                if frames % 100 == 0:
                    pct = (frames / total_frames) * 100
                    print(f"Processing: {pct:.1f}% complete")
        finally:
            cap.release()
            out.release()
        
        return {
            "success": True,
            "message": "Processing complete",
            "video": {
                "filename": os.path.basename(output_path),
                "frames": frames,
                "fps": fps,
                "resolution": f"{out_w}x{out_h}",
                "duration_seconds": frames / fps if fps else 0
            },
            "tracking": {
                "total_points": len(positions),
                "threshold": self.confidence_threshold
            }
        }

    def process_video_buffer(
        self,
        input_buffer: BytesIO,
        draw_box: bool = False,
    ) -> BytesIO:
        """
        Reads MP4 bytes from input_buffer, processes the video via the
        existing `process_video` method, and returns a BytesIO of the
        processed MP4.
        """
        # use RAM-backed temp files
        with tempfile.NamedTemporaryFile(suffix=".mp4") as in_tmp, \
             tempfile.NamedTemporaryFile(suffix=".mp4") as out_tmp:

            # write raw bytes into the input temp file
            in_tmp.write(input_buffer.read())
            in_tmp.flush()

            # run the file-based pipeline
            result = self.process_video(
                video_path=in_tmp.name,
                output_path=out_tmp.name,
                draw_box=draw_box,
            )
            if not result.get("success"):
                return None

            # read processed bytes into memory
            out_tmp.seek(0)
            processed_bytes = out_tmp.read()

        return BytesIO(processed_bytes)