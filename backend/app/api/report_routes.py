from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.report_service import get_report

router = APIRouter(
    prefix="/reports",
    tags=["Wildlife Reports"]
)


@router.get("/")
def reports(
    db: Session = Depends(get_db)
):

    return get_report(db)