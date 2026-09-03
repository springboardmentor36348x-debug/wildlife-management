"""
Species Catalog Schemas
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SpeciesBase(BaseModel):
    common_name: str
    scientific_name: str
    species_group: str  # Mammal, Bird, Reptile, Amphibian, Insect, Marine
    conservation_status: Optional[str] = "Least Concern"
    iucn_status: Optional[str] = "LC"
    description: Optional[str] = None
    habitat_type: Optional[str] = "Forest"
    diet_type: Optional[str] = "Carnivore"
    image_url: Optional[str] = None
    is_endangered: bool = False


class SpeciesCreate(SpeciesBase):
    pass


class SpeciesUpdate(BaseModel):
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    species_group: Optional[str] = None
    conservation_status: Optional[str] = None
    iucn_status: Optional[str] = None
    description: Optional[str] = None
    habitat_type: Optional[str] = None
    diet_type: Optional[str] = None
    image_url: Optional[str] = None
    is_endangered: Optional[bool] = None
    is_active: Optional[bool] = None


class SpeciesResponse(SpeciesBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    total_observations: Optional[int] = 0

    class Config:
        from_attributes = True
