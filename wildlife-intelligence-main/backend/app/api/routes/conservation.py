from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.incident import ActionStatus
from app.schemas.incident import RestorationActionOut, RestorationStatusUpdate
from app.services import conservation_service

router = APIRouter(prefix="/conservation", tags=["Conservation Recommendations"])

CAN_VIEW = (
    UserRole.ADMINISTRATOR,
    UserRole.RESEARCHER,
    UserRole.CONSERVATION_OFFICER,
    UserRole.FOREST_DEPARTMENT,
)

CAN_UPDATE_ACTIONS = (
    UserRole.ADMINISTRATOR,
    UserRole.CONSERVATION_OFFICER,
    UserRole.FOREST_DEPARTMENT,
)


@router.get("/threats")
def conservation_threat_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    """Returns active threat alerts computed live across all engines."""
    return conservation_service.get_threat_alerts(db)


@router.get("/priorities")
def conservation_priorities(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    return conservation_service.get_conservation_priorities(db)


@router.get("/restoration/{site_id}", response_model=list[RestorationActionOut])
def conservation_restoration(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_VIEW)),
):
    """Returns actionable restoration suggestions for a site with tracking statuses."""
    actions = conservation_service.get_or_sync_restoration_actions(db, site_id=site_id)
    return [
        RestorationActionOut(
            id=a.id,
            site_id=a.site_id,
            site_name=a.site.site_name if a.site else None,
            action_text=a.action_text,
            status=a.status,
            assigned_to=a.assigned_to,
            assignee_name=a.assignee.full_name if a.assignee else None,
            notes=a.notes,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in actions
    ]


@router.patch("/restoration/{action_id}/status", response_model=RestorationActionOut)
def update_restoration_status(
    action_id: str,
    payload: RestorationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_UPDATE_ACTIONS)),
):
    """Updates action-tracking status (open/in_progress/completed) on a restoration task."""
    updated = conservation_service.update_restoration_action_status(
        db=db,
        action_id=action_id,
        status=payload.status,
        notes=payload.notes,
        assigned_to=payload.assigned_to,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Restoration action record not found.")

    return RestorationActionOut(
        id=updated.id,
        site_id=updated.site_id,
        site_name=updated.site.site_name if updated.site else None,
        action_text=updated.action_text,
        status=updated.status,
        assigned_to=updated.assigned_to,
        assignee_name=updated.assignee.full_name if updated.assignee else None,
        notes=updated.notes,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


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
