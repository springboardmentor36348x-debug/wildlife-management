from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services import conservation_service

router = APIRouter(prefix="/conservation", tags=["Conservation Recommendations"])

CAN_VIEW = (
    UserRole.ADMINISTRATOR,
    UserRole.RESEARCHER,
    UserRole.CONSERVATION_OFFICER,
    UserRole.FOREST_DEPARTMENT,
)


@router.get("/priorities")
def conservation_priorities(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    return conservation_service.get_conservation_priorities(db)


@router.get("/restoration/{site_id}")
def conservation_restoration(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    return conservation_service.suggest_habitat_restoration(db, site_id=site_id)


@router.get("/protection/{site_id}")
def conservation_protection(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    return conservation_service.suggest_protection_strategies(db, site_id=site_id)


@router.get("/monitoring-optimization")
def conservation_monitoring_optimization(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    return conservation_service.optimize_monitoring(db)


@router.get("/resource-allocation")
def conservation_resource_allocation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    return conservation_service.recommend_resource_allocation(db)
