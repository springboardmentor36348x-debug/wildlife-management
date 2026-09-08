from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.conservation_service import (
    get_conservation_recommendations
)
from app.auth.auth import require_roles


router = APIRouter(
    prefix="/conservation",
    tags=["Conservation Intelligence"]
)


@router.get("/recommendations")
def conservation_recommendations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(
        require_roles(
            "research_officer",
            "forest_officer",
            "admin"
        )
    )
):

    return get_conservation_recommendations(db)