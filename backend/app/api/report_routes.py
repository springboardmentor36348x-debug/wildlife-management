from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.report_service import get_report
from app.auth.auth import require_roles


router = APIRouter(
    prefix="/reports",
    tags=["Wildlife Reports"]
)


@router.get("/")
def reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "student",
            "research_officer",
            "forest_officer",
            "admin"
        )
    )
):

    return get_report(db)