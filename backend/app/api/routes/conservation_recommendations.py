from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.conservation_recommendation_service import generate_recommendations

router = APIRouter(prefix="/conservation-recommendations", tags=["Conservation Recommendation Engine"])


@router.get("/")
def conservation_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    researcher_id = current_user.id if current_user.role == "wildlife_researcher" else None
    return generate_recommendations(db, researcher_id)