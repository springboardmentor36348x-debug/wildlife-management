"""
Notification & Alert System (FR-12) - Milestone 4.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationSummary
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-scans the live data for alert conditions, upserts them, and returns the current alert set."""
    notifications = notification_service.sync_notifications(db)
    if unread_only:
        notifications = [n for n in notifications if not n.is_read]
    return notifications


@router.get("/summary", response_model=NotificationSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = notification_service.sync_notifications(db)
    return NotificationSummary(
        total=len(notifications),
        unread=sum(1 for n in notifications if not n.is_read),
        critical=sum(1 for n in notifications if n.severity.value == "critical"),
        warning=sum(1 for n in notifications if n.severity.value == "warning"),
        info=sum(1 for n in notifications if n.severity.value == "info"),
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).update({Notification.is_read: True})
    db.commit()
    return {"status": "ok"}
