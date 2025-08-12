import os
import uuid
from io import BytesIO
from datetime import timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from firebase_admin import auth as fb_auth, firestore as fb_fs, storage as fb_storage
from app.firebase_config import bucket
from app.barbell_tracker import BarbellPathTracker

from google.cloud.exceptions import NotFound

load_dotenv()

API_TITLE  = "Barbell Tracker API"
MODEL_PATH = os.getenv("YOLO_MODEL")
SIGN_URL_EXP = timedelta(hours = 1)

app = FastAPI(title=API_TITLE)

# initialize tracker
tracker = BarbellPathTracker(
    model_path = MODEL_PATH,
    confidence_threshold = 0.5,
    max_path_length = 1000
)

# security scheme for “Authorization: Bearer <token>”
bearer_scheme = HTTPBearer()

async def get_current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> str:
    # verifies the Firebase JWT and returns uuid
    token = creds.credentials
    try:
        decoded = fb_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/")
async def health_check():
    return {"message": "Barbell Tracker API is up and running"}


@app.post("/process_from_bucket")
async def process_from_bucket(
    blob_path: str = Body(..., embed=True),
    user_id: str = Depends(get_current_user_id),
):
    # download raw bytes from Storage
    blob = bucket.blob(blob_path)
    if not blob.exists():
        raise HTTPException(status_code=404, detail="Source video not found")
    raw_bytes = blob.download_as_bytes()
    input_buffer = BytesIO(raw_bytes)

    # process in-memory
    output_buffer = tracker.process_video_buffer(
        input_buffer,
        draw_box = False,
    )
    if output_buffer is None:
        raise HTTPException(status_code = 500, detail="Video processing failed")

    # upload processed result
    out_blob_path = f"{user_id}/previews/{uuid.uuid4().hex}.mp4"
    out_blob = bucket.blob(out_blob_path)
    out_blob.upload_from_file(output_buffer, content_type = "video/mp4")

    # delete _all_ raw uploads for this user
    raw_prefix = f"{user_id}/raw/"
    # list_blobs returns a generator of Blob objects
    blobs = list(bucket.list_blobs(prefix=raw_prefix))
    if blobs:
        bucket.delete_blobs(blobs)

    # return signed URL
    url = out_blob.generate_signed_url(
        expiration = SIGN_URL_EXP,
        method="GET"
    )
    return {"url": url, "out_blob_path": out_blob_path}

@app.post("/promote_preview")
async def promote_preview(
    preview_path: str = Body(... , embed=True),
    user_id: str = Depends(get_current_user_id),
):
    if not preview_path or not preview_path.startswith(f"{user_id}/previews/"):
        raise HTTPException(status_code=403, detail="Invalid preview path for this user")

    file_name = preview_path.split("/")[-1]
    if not file_name.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Preview must be an .mp4")

    video_id = file_name[:-4]
    library_path = f"{user_id}/library/{video_id}.mp4"

    src = bucket.blob(preview_path)
    if not src.exists():
        raise HTTPException(status_code=404, detail="Preview not found")

    # if not already saved, COPY server‑side (no download/upload)
    dst = bucket.blob(library_path)
    if not dst.exists():
        # copy_blob(source_blob, destination_bucket, new_name)
        dst = bucket.copy_blob(src, bucket, library_path)
        dst.content_type = "video/mp4"
        dst.metadata = {"firebaseStorageDownloadTokens": uuid.uuid4().hex}
        dst.patch()

    # delete preview
    try:
        src.delete()
    except Exception:
        pass

    # Firestore update
    db = fb_fs.client()
    db.collection("users").document(user_id)\
        .collection("videos").document(video_id)\
        .set({
            "blobPath": library_path,
            "status": "saved",
            "savedAt": fb_fs.SERVER_TIMESTAMP,
        }, merge=True)

    return {"blobPath": library_path, "status": "saved"}