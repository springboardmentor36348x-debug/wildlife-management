from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services import health_score_service

router = APIRouter(prefix="/health", tags=["Ecosystem Health Scoring"])


@router.get("/score")
def health_score(
    site_id: str | None = None,
    survey_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return health_score_service.calculate_ecosystem_health(db, site_id=site_id, survey_id=survey_id)


@router.get("/score/all-sites")
def health_score_all_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return health_score_service.calculate_ecosystem_health_all_sites(db)
