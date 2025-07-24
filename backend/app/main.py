import os
import uuid
from io import BytesIO
from datetime import timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from firebase_admin import auth as fb_auth
from app.firebase_config import bucket
from app.barbell_tracker import BarbellPathTracker

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
    # download raw bytes from Storage ———
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
    out_blob_path = f"{user_id}/processed/{uuid.uuid4().hex}.mp4"
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
