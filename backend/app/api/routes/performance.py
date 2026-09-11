"""
Performance Metrics (FR-8) - Milestone 4.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services import performance_service

router = APIRouter(prefix="/performance", tags=["Performance"])


@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return performance_service.get_performance_metrics(db)
