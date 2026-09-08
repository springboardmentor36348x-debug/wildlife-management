from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.ecosystem_service import get_ecosystem_health
from app.auth.auth import require_roles


router = APIRouter(
    prefix="/ecosystem",
    tags=["Ecosystem Health"]
)


@router.get("/health")
def ecosystem_health(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "research_officer",
            "forest_officer",
            "admin"
        )
    )
):

    return get_ecosystem_health(db)