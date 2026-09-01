from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.ecosystem_service import get_ecosystem_health


router = APIRouter(
    prefix="/ecosystem",
    tags=["Ecosystem Health"]
)


@router.get("/health")
def ecosystem_health(
    db: Session = Depends(get_db)
):
    return get_ecosystem_health(db)