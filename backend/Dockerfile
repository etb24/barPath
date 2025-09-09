# syntax=docker/dockerfile:1
ARG PYTHON_VERSION=3.11
FROM python:${PYTHON_VERSION}-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps needed by OpenCV/ffmpeg; curl for HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies
COPY requirements.txt .

RUN python -m pip install --upgrade pip \
 && python -m pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision torchaudio \
 && python -m pip install opencv-python-headless \
 && python -m pip install --no-deps ultralytics \
 && python -m pip install -r requirements.txt

# App
COPY . .

ENV MODULE_PATH=app.main:app

# Non-root user (good hygiene)
RUN useradd -m appuser
USER appuser

EXPOSE 8000

# Runtime healthcheck hitting /health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# Run uvicorn directly. You can add --workers N if you want.
CMD ["sh","-lc","uvicorn $MODULE_PATH --host 0.0.0.0 --port 8000 --proxy-headers --timeout-keep-alive 75"]