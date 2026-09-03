"""
Admin and System Schemas
"""

from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime


class SystemMetrics(BaseModel):
    total_users: int
    total_sites: int
    total_surveys: int
    total_observations: int
    total_species: int
    active_alerts: int
    image_inference_avg_latency_ms: float
    audio_processing_avg_latency_ms: float
    api_response_avg_ms: float
    system_status: str
    active_devices: int
    database_type: str
    uptime_seconds: float
    ai_models_status: Dict[str, str]


class UserRoleUpdate(BaseModel):
    role: str
    is_active: bool
