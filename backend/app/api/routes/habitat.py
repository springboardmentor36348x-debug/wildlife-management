from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.habitat_service import calculate_habitat_intelligence

router = APIRouter(prefix="/habitat", tags=["Habitat Intelligence Engine"])


@router.get("/intelligence")
def habitat_intelligence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Per-site habitat health scoring, derived from species diversity and
    population stability observed at each monitoring site. Wildlife
    Researchers are scoped to their own surveys' sites; other roles see
    the full system-wide view.
    """
    researcher_id = current_user.id if current_user.role == "wildlife_researcher" else None
    return calculate_habitat_intelligence(db, researcher_id)