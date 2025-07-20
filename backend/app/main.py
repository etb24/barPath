import os
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from app.barbell_tracker import BarbellPathTracker
from dotenv import load_dotenv


load_dotenv()
MODEL_PATH = os.getenv("YOLO_MODEL_PATH")

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# initialize
app = FastAPI(title="Barbell Tracker API")
tracker = BarbellPathTracker(
    model_path = MODEL_PATH,
    confidence_threshold=0.5,
    max_path_length = 1000
)

def _cleanup_file(path: str):
    try:
        os.remove(path)
    except OSError:
        pass

@app.get("/")
async def read_root():
    return {"message": "Barbell Tracker API is up and running"}


@app.post("/process", response_class=FileResponse)
async def process_video(
    file: UploadFile = File(...),
):
    # save upload to disk
    ext = os.path.splitext(file.filename)[1] or ".mp4"
    uid = uuid.uuid4().hex
    input_path = os.path.join(UPLOAD_DIR,    f"{uid}{ext}")
    output_path = os.path.join(PROCESSED_DIR, f"{uid}_out{ext}")

    with open(input_path, "wb") as f:
        f.write(await file.read())

    # process
    result = tracker.process_video(
        video_path = input_path,
        output_path = output_path,
        draw_box = False,
        smooth_path = True
    )

    if not result.get("success"):
        # clean up the failed input file
        return HTTPException(status_code=500, detail = result.get("message", "Unknown error"))

    # return with cleanup
    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=os.path.basename(output_path),
        background=BackgroundTask(lambda: (_cleanup_file(input_path), _cleanup_file(output_path)))
    )
