from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.species_prediction import SpeciesPrediction
from app.models.audio_prediction import AudioPrediction

router = APIRouter(prefix="/user-activity", tags=["User Activity"])


@router.get("/by-user")
def detections_by_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Breaks down image + audio detection counts per user — who uploaded what.
    Restricted to roles with system-wide visibility (matches the same
    permission pattern used by /image-analysis/ and /bioacoustics/ list endpoints).
    """
    if current_user.role not in ["administrator", "conservation_officer", "forest_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to view user activity breakdown")

    image_counts = dict(
        db.query(SpeciesPrediction.created_by, func.count(SpeciesPrediction.id))
        .group_by(SpeciesPrediction.created_by)
        .all()
    )
    audio_counts = dict(
        db.query(AudioPrediction.created_by, func.count(AudioPrediction.id))
        .group_by(AudioPrediction.created_by)
        .all()
    )

    all_user_ids = set(image_counts.keys()) | set(audio_counts.keys())
    users = db.query(User).filter(User.id.in_(all_user_ids)).all() if all_user_ids else []
    user_lookup = {u.id: u for u in users}

    result = []
    for user_id in all_user_ids:
        if user_id is None:
            continue
        user = user_lookup.get(user_id)
        result.append({
            "user_id": user_id,
            "full_name": user.full_name if user else "Unknown user",
            "email": user.email if user else None,
            "role": user.role if user else None,
            "image_detections": image_counts.get(user_id, 0),
            "audio_detections": audio_counts.get(user_id, 0),
            "total_detections": image_counts.get(user_id, 0) + audio_counts.get(user_id, 0),
        })

    result.sort(key=lambda r: r["total_detections"], reverse=True)
    return result