from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.population_service import calculate_population_estimates

router = APIRouter(prefix="/population", tags=["Population Estimation Engine"])


@router.get("/estimates")
def population_estimates(
    monitoring_site_id: Optional[str] = None,
    survey_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Population counts, site-density estimates, and trend direction
    (increasing/decreasing/stable) per species. Wildlife Researchers are
    scoped to their own surveys; other roles see the full system-wide view.
    """
    researcher_id = current_user.id if current_user.role == "wildlife_researcher" else None
    return calculate_population_estimates(db, monitoring_site_id, survey_id, researcher_id)