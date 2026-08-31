from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ecosystem_health_service import calculate_ecosystem_health

router = APIRouter(prefix="/ecosystem-health", tags=["Ecosystem Health Analytics"])


@router.get("/score")
def ecosystem_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    researcher_id = current_user.id if current_user.role == "wildlife_researcher" else None
    return calculate_ecosystem_health(db, researcher_id)