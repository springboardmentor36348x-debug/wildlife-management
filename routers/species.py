"""
Species Catalog Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import Species, Observation, User
from schemas.species import SpeciesCreate, SpeciesUpdate, SpeciesResponse
from security import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[SpeciesResponse])
def list_species(
    group: Optional[str] = None,
    is_endangered: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List species with filter criteria and total observation counts"""
    query = db.query(Species).filter(Species.is_active == True)
    
    if group:
        query = query.filter(Species.species_group.ilike(f"%{group}%"))
    if is_endangered is not None:
        query = query.filter(Species.is_endangered == is_endangered)
    if search:
        query = query.filter(
            (Species.common_name.ilike(f"%{search}%")) |
            (Species.scientific_name.ilike(f"%{search}%"))
        )

    species_list = query.offset(skip).limit(limit).all()

    results = []
    for sp in species_list:
        obs_count = db.query(func.count(Observation.id)).filter(Observation.species_id == sp.id).scalar() or 0
        results.append(SpeciesResponse(
            id=sp.id,
            common_name=sp.common_name,
            scientific_name=sp.scientific_name,
            species_group=sp.species_group,
            conservation_status=sp.conservation_status,
            iucn_status=sp.iucn_status,
            description=sp.description,
            habitat_type=sp.habitat_type,
            diet_type=sp.diet_type,
            image_url=sp.image_url,
            is_endangered=sp.is_endangered,
            is_active=sp.is_active,
            created_at=sp.created_at,
            total_observations=obs_count
        ))

    return results


@router.post("/", response_model=SpeciesResponse, status_code=status.HTTP_201_CREATED)
def create_species(
    species_in: SpeciesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a new species to catalog"""
    existing = db.query(Species).filter(Species.scientific_name == species_in.scientific_name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Species '{species_in.scientific_name}' already exists")

    sp = Species(
        common_name=species_in.common_name,
        scientific_name=species_in.scientific_name,
        species_group=species_in.species_group,
        conservation_status=species_in.conservation_status,
        iucn_status=species_in.iucn_status,
        description=species_in.description,
        habitat_type=species_in.habitat_type,
        diet_type=species_in.diet_type,
        image_url=species_in.image_url,
        is_endangered=species_in.is_endangered,
        is_active=True
    )
    db.add(sp)
    db.commit()
    db.refresh(sp)

    return SpeciesResponse(
        id=sp.id,
        common_name=sp.common_name,
        scientific_name=sp.scientific_name,
        species_group=sp.species_group,
        conservation_status=sp.conservation_status,
        iucn_status=sp.iucn_status,
        description=sp.description,
        habitat_type=sp.habitat_type,
        diet_type=sp.diet_type,
        image_url=sp.image_url,
        is_endangered=sp.is_endangered,
        is_active=sp.is_active,
        created_at=sp.created_at,
        total_observations=0
    )


@router.get("/{species_id}", response_model=SpeciesResponse)
def get_species_detail(
    species_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve detailed species info"""
    sp = db.query(Species).filter(Species.id == species_id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Species not found")
    
    obs_count = db.query(func.count(Observation.id)).filter(Observation.species_id == sp.id).scalar() or 0
    return SpeciesResponse(
        id=sp.id,
        common_name=sp.common_name,
        scientific_name=sp.scientific_name,
        species_group=sp.species_group,
        conservation_status=sp.conservation_status,
        iucn_status=sp.iucn_status,
        description=sp.description,
        habitat_type=sp.habitat_type,
        diet_type=sp.diet_type,
        image_url=sp.image_url,
        is_endangered=sp.is_endangered,
        is_active=sp.is_active,
        created_at=sp.created_at,
        total_observations=obs_count
    )
