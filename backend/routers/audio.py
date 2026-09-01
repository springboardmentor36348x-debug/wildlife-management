from fastapi import APIRouter, File, UploadFile, HTTPException
import services.audio_service as audio_service

router = APIRouter(prefix="/api/v1", tags=["Bioacoustic Recognition"])

@router.post("/analyze-audio")
def analyze_audio(file: UploadFile = File(...)):
    """
    Upload an audio recording (.wav, .mp3, .ogg, .flac) for bioacoustic recognition.
    Returns ONLY the single top recommended species prediction and confidence score.
    """
    allowed_extensions = (".wav", ".mp3", ".ogg", ".flac", ".m4a")
    filename_lower = file.filename.lower() if file.filename else ""

    is_audio_mime = file.content_type and file.content_type.startswith("audio/")
    has_audio_ext = any(filename_lower.endswith(ext) for ext in allowed_extensions)

    if not (is_audio_mime or has_audio_ext):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be a valid audio recording (.wav, .mp3, .ogg, .flac, .m4a)"
        )

    try:
        contents = file.file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

        result = audio_service.run_audio_classification(contents, filename=file.filename)
        return result

    except FileNotFoundError as fnf:
        raise HTTPException(status_code=500, detail=f"Model error: {str(fnf)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")
