from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.biodiversity_service import calculate_biodiversity_index

router = APIRouter(prefix="/biodiversity", tags=["Biodiversity Intelligence Engine"])


@router.get("/index")
def biodiversity_index(
    monitoring_site_id: Optional[str] = None,
    survey_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns species richness, Shannon index, Simpson index, evenness, and a
    per-species relative-abundance breakdown — optionally scoped to a single
    monitoring site or survey. Wildlife Researchers are automatically scoped
    to their own surveys only; other roles see the full system-wide picture.
    """
    researcher_id = current_user.id if current_user.role == "wildlife_researcher" else None
    return calculate_biodiversity_index(db, monitoring_site_id, survey_id, researcher_id)