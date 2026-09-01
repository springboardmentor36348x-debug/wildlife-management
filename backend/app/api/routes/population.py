from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services import population_service

router = APIRouter(prefix="/population", tags=["Population Intelligence"])


@router.get("/counts")
def population_counts(
    survey_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return population_service.get_population_counts(db, survey_id=survey_id)


@router.get("/density")
def population_density(
    survey_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return population_service.get_population_density(db, survey_id=survey_id)


@router.get("/trend")
def population_trend(
    species: str,
    survey_id: str | None = None,
    window_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return population_service.get_population_trend(
        db, species_label=species, survey_id=survey_id, window_days=window_days
    )


@router.get("/distribution")
def population_distribution(
    survey_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return population_service.get_species_distribution(db, survey_id=survey_id)


@router.get("/movement")
def population_movement(
    species: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return population_service.get_species_site_movement(db, species_label=species)
