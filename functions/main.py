"""Firebase Cloud Function: bake the on-device bar path into a shareable MP4.

The heavy work (YOLO detection) already happened on-device — this function only
draws the stored, normalized path onto the original video and re-encodes, so it
needs no ML model. The drawn trail mirrors the in-app Skia overlay: a red->black
gradient that grows as the clip plays, so the baked file matches what users see.

Baking runs lazily, only when a user chooses to save-to-camera-roll, and the
result is cached in Storage so repeat exports don't re-encode.
"""

# TODO: consider using a more efficient video processing library (e.g. ffmpeg) instead of OpenCV, which is slow and heavy for this task. OpenCV is convenient because it handles rotation metadata automatically, but it's overkill for just drawing lines on frames.

import os
import tempfile

import cv2
import numpy as np
from firebase_admin import initialize_app, storage, firestore
from firebase_functions import https_fn, options

initialize_app()

# BGR (OpenCV channel order). Oldest segment = black, newest = red — matches PathOverlay.
PALETTE_START = np.array([0, 0, 255], dtype=np.float32)  # red
PALETTE_END = np.array([0, 0, 0], dtype=np.float32)      # black
STROKE = 3


def _bake(src_path: str, dst_path: str, positions: list) -> bool:
    cap = cv2.VideoCapture(src_path)
    # apply the video's rotation metadata so frames come out upright — the path was
    # computed on-device from upright thumbnails.
    try:
        cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
    except Exception:
        pass
    if not cap.isOpened():
        return False

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    out = cv2.VideoWriter(dst_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    if not out.isOpened():
        cap.release()
        return False

    times = [p["t"] for p in positions]
    pts = [(p["x"], p["y"]) for p in positions]

    frame_idx = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            t_ms = (frame_idx / fps) * 1000.0

            # trail grows to the points visible by this frame's timestamp
            visible = 0
            while visible < len(times) and times[visible] <= t_ms:
                visible += 1

            if visible >= 2:
                for i in range(1, visible):
                    frac = i / (visible - 1)  # 0 = oldest (black) .. 1 = newest (red)
                    color = (PALETTE_END * (1 - frac) + PALETTE_START * frac).astype(int)
                    x1, y1 = pts[i - 1]
                    x2, y2 = pts[i]
                    cv2.line(
                        frame,
                        (int(x1 * width), int(y1 * height)),
                        (int(x2 * width), int(y2 * height)),
                        tuple(int(c) for c in color),
                        STROKE,
                        cv2.LINE_AA,
                    )
            out.write(frame)
            frame_idx += 1
    finally:
        cap.release()
        out.release()
    return frame_idx > 0


@https_fn.on_call(memory=options.MemoryOption.GB_1, timeout_sec=300)
def bake_video(req: https_fn.CallableRequest):
    uid = req.auth.uid if req.auth else None
    if not uid:
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.UNAUTHENTICATED, "Sign in required."
        )

    video_id = (req.data or {}).get("videoId")
    if not video_id:
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.INVALID_ARGUMENT, "videoId is required."
        )

    db = firestore.client()
    doc_ref = (
        db.collection("users").document(uid).collection("videos").document(video_id)
    )
    snap = doc_ref.get()
    if not snap.exists:
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.NOT_FOUND, "Video not found."
        )
    data = snap.to_dict()

    bucket = storage.bucket()

    # reuse a previous bake if it's still there (avoid re-encoding on every export)
    baked_blob_path = data.get("bakedBlobPath")
    if baked_blob_path and bucket.blob(baked_blob_path).exists():
        return {"bakedBlobPath": baked_blob_path}

    video_blob_path = data.get("videoBlobPath")
    positions = data.get("path") or []
    if not video_blob_path:
        raise https_fn.HttpsError(
            https_fn.FunctionsErrorCode.FAILED_PRECONDITION, "No source video."
        )

    in_path = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
    out_path = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
    try:
        bucket.blob(video_blob_path).download_to_filename(in_path)
        if not _bake(in_path, out_path, positions):
            raise https_fn.HttpsError(
                https_fn.FunctionsErrorCode.INTERNAL, "Baking failed."
            )

        baked_blob_path = f"{uid}/baked/{video_id}.mp4"
        bucket.blob(baked_blob_path).upload_from_filename(
            out_path, content_type="video/mp4"
        )
        doc_ref.set({"bakedBlobPath": baked_blob_path}, merge=True)
        return {"bakedBlobPath": baked_blob_path}
    finally:
        for p in (in_path, out_path):
            try:
                os.remove(p)
            except OSError:
                pass
