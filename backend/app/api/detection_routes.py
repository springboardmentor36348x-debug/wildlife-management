from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil
import os

from app.database.connection import get_db
from app.ai.detector import detect_animal
from app.services.detection_service import save_detection
from app.services.history_service import get_detection_history
router = APIRouter(
    prefix="/detect",
    tags=["AI Detection"]
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/image")
async def detect_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detections = detect_animal(file_path)

    # Save all detections into PostgreSQL
    for item in detections:
        save_detection(
            db=db,
            image_name=file.filename,
            animal=item["animal"],
            confidence=item["confidence"]
        )

    return {
        "filename": file.filename,
        "detections": detections
    }

@router.get("/history")
def detection_history(
    db: Session = Depends(get_db)
):

    history = get_detection_history(db)

    return history