from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter

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
    if current_user.role not in ["administrator", "conservation_officer", "forest_officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to view user activity breakdown")

    image_rows = db.query(
        SpeciesPrediction.created_by, SpeciesPrediction.predicted_species
    ).all()
    audio_rows = db.query(
        AudioPrediction.created_by, AudioPrediction.predicted_species
    ).all()

    image_species_by_user = {}
    for user_id, species in image_rows:
        image_species_by_user.setdefault(user_id, []).append(species)

    audio_species_by_user = {}
    for user_id, species in audio_rows:
        audio_species_by_user.setdefault(user_id, []).append(species)

    all_user_ids = set(image_species_by_user.keys()) | set(audio_species_by_user.keys())
    users = db.query(User).filter(User.id.in_(all_user_ids)).all() if all_user_ids else []
    user_lookup = {u.id: u for u in users}

    result = []
    for user_id in all_user_ids:
        if user_id is None:
            continue
        user = user_lookup.get(user_id)

        image_species = image_species_by_user.get(user_id, [])
        audio_species = audio_species_by_user.get(user_id, [])

        image_breakdown = [
            {"species_name": s, "count": c}
            for s, c in Counter(image_species).most_common()
        ]
        audio_breakdown = [
            {"species_name": s, "count": c}
            for s, c in Counter(audio_species).most_common()
        ]

        result.append({
            "user_id": user_id,
            "full_name": user.full_name if user else "Unknown user",
            "email": user.email if user else None,
            "role": user.role if user else None,
            "image_detections": len(image_species),
            "audio_detections": len(audio_species),
            "total_detections": len(image_species) + len(audio_species),
            "image_species_breakdown": image_breakdown,
            "audio_species_breakdown": audio_breakdown,
        })

    result.sort(key=lambda r: r["total_detections"], reverse=True)
    return result