from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.analytics_service import get_analytics

router = APIRouter(
    prefix="/analytics",
    tags=["Biodiversity Analytics"]
)


@router.get("/")
def analytics(
    db: Session = Depends(get_db)
):

    return get_analytics(db)