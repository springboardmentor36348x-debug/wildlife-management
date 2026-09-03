import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HabitatAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    monitoring_site_id: uuid.UUID
    vegetation_index_proxy: float
    degradation_risk_score: float
    habitat_suitability_score: float
    habitat_quality_score: float
    degradation_status_label: str
    assessed_at: datetime
