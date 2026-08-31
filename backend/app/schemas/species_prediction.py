from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SpeciesPredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    monitoring_site_id: Optional[str] = None
    camera_trap_id: Optional[str] = None
    file_path: str
    predicted_species: str
    confidence: float
    taxonomic_group: Optional[str] = None
    conservation_status: Optional[str] = None
    is_endangered: bool
    model_name: str
    created_at: datetime