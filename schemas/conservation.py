"""
Conservation Intelligence Schemas (Alerts, Recommendations, Actions)
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ConservationAlertCreate(BaseModel):
    alert_type: str  # endangered_species, population_decline, habitat_degradation, device_issue
    severity: str  # critical, high, medium, low
    description: str
    monitoring_site_id: Optional[int] = None
    species_id: Optional[int] = None


class ConservationAlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    description: str
    monitoring_site_id: Optional[int] = None
    species_id: Optional[int] = None
    site_name: Optional[str] = None
    species_name: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AIRecommendationResponse(BaseModel):
    id: int
    recommendation_type: str
    title: str
    description: str
    priority: str  # critical, high, medium, low
    evidence: str
    status: str  # pending, approved, implemented
    monitoring_site_id: Optional[int] = None
    species_id: Optional[int] = None
    site_name: Optional[str] = None
    species_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConservationActionCreate(BaseModel):
    action_type: str
    description: str
    monitoring_site_id: Optional[int] = None
    species_id: Optional[int] = None
    status: str = "planned"
    start_date: datetime
    end_date: Optional[datetime] = None
    responsible_party: Optional[str] = None
    outcome: Optional[str] = None


class ConservationActionResponse(ConservationActionCreate):
    id: int
    created_at: Optional[datetime] = None
    site_name: Optional[str] = None
    species_name: Optional[str] = None

    class Config:
        from_attributes = True
