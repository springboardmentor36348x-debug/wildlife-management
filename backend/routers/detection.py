from fastapi import APIRouter, File, UploadFile, HTTPException
import services.yolo_service as yolo_service

router = APIRouter(prefix="/api/v1", tags=["Species Detection"])

@router.post("/detect-species")
def detect_species(file: UploadFile = File(...)):
    """
    Upload an image file to run wildlife species classification & detection using trained YOLOv9 model.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (e.g. JPG, PNG)")
    
    try:
        contents = file.file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
        results = yolo_service.run_detection(contents)
        return results
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=500, detail=f"Model error: {str(fnf)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
