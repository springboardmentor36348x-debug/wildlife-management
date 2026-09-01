from fastapi import APIRouter, UploadFile, File
import shutil
import os

from app.ai.audio_detector import detect_audio_sound

router = APIRouter(
    prefix="/audio",
    tags=["Audio Detection"]
)

UPLOAD_FOLDER = "audio_uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

@router.post("/detect")
async def detect_audio(
    file: UploadFile = File(...)
):
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    result = detect_audio_sound(
        file_path
    )

    return result