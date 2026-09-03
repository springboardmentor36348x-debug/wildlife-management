import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.conservation import RecommendationPriority, RecommendationCategory


class ConservationRecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    monitoring_site_id: uuid.UUID
    priority: RecommendationPriority
    category: RecommendationCategory
    title: str
    description: str
    rationale: Optional[str] = None
    is_resolved: str
    generated_at: datetime


class RecommendationStatusUpdate(BaseModel):
    status: str  # open | in_progress | resolved
