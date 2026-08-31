import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.animal_counter import detect_and_count_animals, is_model_ready

router = APIRouter(prefix="/animal-counting", tags=["Animal Counting Engine (YOLOv8)"])

UPLOAD_DIR = os.path.join("uploads", "annotated")
os.makedirs(UPLOAD_DIR, exist_ok=True)

VALID_EXTENSIONS = (".jpg", ".jpeg", ".png")


@router.get("/status")
def model_status():
    return {"model_ready": is_model_ready()}


@router.post("/detect")
async def detect_animals(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in VALID_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .jpg/.jpeg/.png images are supported")

    content = await file.read()

    try:
        annotated_bytes, count, detections = detect_and_count_animals(content)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Animal counting failed: {str(e)}")

    stored_name = f"{uuid.uuid4()}.jpg"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(annotated_bytes)

    return {
        "animal_count": count,
        "detections": detections,
        "annotated_image_url": f"/animal-counting/image/{stored_name}",
    }


@router.get("/image/{filename}")
def get_annotated_image(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/jpeg")