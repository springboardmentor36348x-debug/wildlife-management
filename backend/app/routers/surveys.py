import uuid


from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.security import get_current_user, require_roles
router = APIRouter()

# In-Memory Databases for Day 7 CRUD
db_surveys = {}
db_sites = {}
db_sensors = {}
db_observations = {}

# --- Pydantic Schemas ---
class SurveyCreate(BaseModel):
    title: str
    target_species: str
    location: str
    start_date: str
    end_date: str

class SiteCreate(BaseModel):
    survey_id: str
    site_name: str
    latitude: float
    longitude: float
    habitat_type: str

class SensorCreate(BaseModel):
    site_id: str
    sensor_type: str # camera_trap, audio_sensor, GPS_collar
    model_name: str
    status: str = "active" # active, maintenance, inactive

class ObservationCreate(BaseModel):
    sensor_id: str
    species_name: str
    count: int = Field(gt=0, description="Count must be greater than 0")
    confidence_score: float = Field(ge=0.0, le=1.0)
    image_url: Optional[str] = None


# --- 1. Survey Endpoints ---
@router.post("/surveys", status_code=status.HTTP_201_CREATED)
def create_survey(survey: SurveyCreate, user: dict = Depends(get_current_user)):
    survey_id = f"SRV-{str(uuid.uuid4())[:8]}"
    survey_data = survey.dict()
    survey_data.update({"id": survey_id, "created_by": user["email"], "created_at": str(datetime.now())})
    db_surveys[survey_id] = survey_data
    return {"message": "Survey created successfully!", "data": survey_data}

@router.get("/surveys")
def get_all_surveys(user: dict = Depends(get_current_user)):
    return {"surveys": list(db_surveys.values())}


# --- 2. Monitoring Site Endpoints ---
@router.post("/sites", status_code=status.HTTP_201_CREATED)
def create_site(site: SiteCreate, user: dict = Depends(require_roles(["forest", "researcher", "administrator"]))):
    if site.survey_id not in db_surveys:
        raise HTTPException(status_code=404, detail="Survey ID not found!")
    
    site_id = f"SIT-{str(uuid.uuid4())[:8]}"
    site_data = site.dict()
    site_data.update({"id": site_id, "registered_by": user["email"]})
    db_sites[site_id] = site_data
    return {"message": "Monitoring Site registered successfully!", "data": site_data}


# --- 3. Camera / Audio Sensor Endpoints ---
@router.post("/sensors", status_code=status.HTTP_201_CREATED)
def register_sensor(sensor: SensorCreate, user: dict = Depends(get_current_user)):
    if sensor.site_id not in db_sites:
        raise HTTPException(status_code=404, detail="Site ID not found!")
    
    sensor_id = f"SEN-{str(uuid.uuid4())[:8]}"
    sensor_data = sensor.dict()
    sensor_data.update({"id": sensor_id, "installed_by": user["email"]})
    db_sensors[sensor_id] = sensor_data
    return {"message": "Sensor registered successfully!", "data": sensor_data}


# --- 4. Observation Recording Endpoints ---
@router.post("/observations", status_code=status.HTTP_201_CREATED)
def record_observation(obs: ObservationCreate, user: dict = Depends(get_current_user)):
    if obs.sensor_id not in db_sensors:
        raise HTTPException(status_code=404, detail="Sensor ID not found!")
    
    obs_id = f"OBS-{len(db_observations) + 501}"
    obs_data = obs.dict()
    obs_data.update({"id": obs_id, "recorded_at": str(datetime.now()), "recorded_by": user["email"]})
    db_observations[obs_id] = obs_data
    return {"message": "Wildlife observation recorded successfully!", "data": obs_data}

@router.get("/observations")
def get_observations(user: dict = Depends(get_current_user)):
    return {"observations": list(db_observations.values())}