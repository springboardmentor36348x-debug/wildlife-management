from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime

from database import get_db
import models
import models_monitoring as mm
import schemas_monitoring as sm
from auth import get_current_user
from permissions import manage_site_infra, manage_observations, admin_only

router = APIRouter()


# ---------------------------------------------------------------
# Helpers — attach human-readable related names to response objects
# (mirrors what the frontend tables/pages expect; avoids duplicating
# GPS/habitat/protected-area data on Survey per the "no duplication"
# requirement — those stay on MonitoringSite).
# ---------------------------------------------------------------
def _attach_site_name(obj):
    obj.monitoring_site_name = obj.monitoring_site.site_name if obj.monitoring_site else None
    return obj


def _attach_survey_extras(survey):
    survey.monitoring_site_name = survey.monitoring_site.site_name if survey.monitoring_site else None
    survey.camera_trap_name = survey.camera_trap.camera_name if survey.camera_trap else None
    survey.audio_sensor_name = survey.audio_sensor.sensor_name if survey.audio_sensor else None
    return survey


def _attach_obs_extras(obs):
    obs.monitoring_site_name = obs.monitoring_site.site_name if obs.monitoring_site else None
    obs.survey_name = obs.survey.survey_name if obs.survey else None
    return obs


def _site_or_404(db, site_id):
    site = db.query(mm.MonitoringSite).filter(mm.MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=400, detail="Monitoring site does not exist")
    return site


# =================================================================
# MONITORING SITES
# =================================================================
@router.post("/monitoring-sites", response_model=sm.MonitoringSiteOut, status_code=201, tags=["Monitoring Sites"])
def create_monitoring_site(payload: sm.MonitoringSiteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    site = mm.MonitoringSite(**payload.model_dump(), created_by_id=current_user.id)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/monitoring-sites", response_model=list[sm.MonitoringSiteOut], tags=["Monitoring Sites"])
def list_monitoring_sites(
    search: Optional[str] = None,
    habitat_type: Optional[mm.HabitatType] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(mm.MonitoringSite)
    if search:
        q = q.filter(or_(
            mm.MonitoringSite.site_name.ilike(f"%{search}%"),
            mm.MonitoringSite.location.ilike(f"%{search}%"),
        ))
    if habitat_type:
        q = q.filter(mm.MonitoringSite.habitat_type == habitat_type)
    return q.order_by(mm.MonitoringSite.created_at.desc()).all()


@router.get("/monitoring-sites/{site_id}", response_model=sm.MonitoringSiteOut, tags=["Monitoring Sites"])
def get_monitoring_site(site_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    site = db.query(mm.MonitoringSite).filter(mm.MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    return site


@router.put("/monitoring-sites/{site_id}", response_model=sm.MonitoringSiteOut, tags=["Monitoring Sites"])
def update_monitoring_site(site_id: int, payload: sm.MonitoringSiteUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    site = db.query(mm.MonitoringSite).filter(mm.MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    for k, v in payload.model_dump().items():
        setattr(site, k, v)
    db.commit()
    db.refresh(site)
    return site


@router.delete("/monitoring-sites/{site_id}", status_code=204, tags=["Monitoring Sites"])
def delete_monitoring_site(site_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_only)):
    site = db.query(mm.MonitoringSite).filter(mm.MonitoringSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")
    db.delete(site)
    db.commit()
    return None


# =================================================================
# CAMERA TRAPS
# =================================================================
@router.post("/camera-traps", response_model=sm.CameraTrapOut, status_code=201, tags=["Camera Traps"])
def create_camera_trap(payload: sm.CameraTrapCreate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    _site_or_404(db, payload.monitoring_site_id)
    cam = mm.CameraTrap(**payload.model_dump(), created_by_id=current_user.id)
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return _attach_site_name(cam)


@router.get("/camera-traps", response_model=list[sm.CameraTrapOut], tags=["Camera Traps"])
def list_camera_traps(
    search: Optional[str] = None,
    site_id: Optional[int] = None,
    status: Optional[mm.DeviceStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(mm.CameraTrap)
    if search:
        q = q.filter(mm.CameraTrap.camera_name.ilike(f"%{search}%"))
    if site_id:
        q = q.filter(mm.CameraTrap.monitoring_site_id == site_id)
    if status:
        q = q.filter(mm.CameraTrap.status == status)
    cams = q.order_by(mm.CameraTrap.created_at.desc()).all()
    return [_attach_site_name(c) for c in cams]


@router.get("/camera-traps/{cam_id}", response_model=sm.CameraTrapOut, tags=["Camera Traps"])
def get_camera_trap(cam_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cam = db.query(mm.CameraTrap).filter(mm.CameraTrap.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera trap not found")
    return _attach_site_name(cam)


@router.put("/camera-traps/{cam_id}", response_model=sm.CameraTrapOut, tags=["Camera Traps"])
def update_camera_trap(cam_id: int, payload: sm.CameraTrapUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    cam = db.query(mm.CameraTrap).filter(mm.CameraTrap.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera trap not found")
    for k, v in payload.model_dump().items():
        setattr(cam, k, v)
    db.commit()
    db.refresh(cam)
    return _attach_site_name(cam)


@router.delete("/camera-traps/{cam_id}", status_code=204, tags=["Camera Traps"])
def delete_camera_trap(cam_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_only)):
    cam = db.query(mm.CameraTrap).filter(mm.CameraTrap.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera trap not found")
    db.delete(cam)
    db.commit()
    return None


# =================================================================
# AUDIO SENSORS  (mirrors camera traps)
# =================================================================
@router.post("/audio-sensors", response_model=sm.AudioSensorOut, status_code=201, tags=["Audio Sensors"])
def create_audio_sensor(payload: sm.AudioSensorCreate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    _site_or_404(db, payload.monitoring_site_id)
    sensor = mm.AudioSensor(**payload.model_dump(), created_by_id=current_user.id)
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return _attach_site_name(sensor)


@router.get("/audio-sensors", response_model=list[sm.AudioSensorOut], tags=["Audio Sensors"])
def list_audio_sensors(
    search: Optional[str] = None,
    site_id: Optional[int] = None,
    status: Optional[mm.DeviceStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(mm.AudioSensor)
    if search:
        q = q.filter(mm.AudioSensor.sensor_name.ilike(f"%{search}%"))
    if site_id:
        q = q.filter(mm.AudioSensor.monitoring_site_id == site_id)
    if status:
        q = q.filter(mm.AudioSensor.status == status)
    sensors = q.order_by(mm.AudioSensor.created_at.desc()).all()
    return [_attach_site_name(s) for s in sensors]


@router.get("/audio-sensors/{sensor_id}", response_model=sm.AudioSensorOut, tags=["Audio Sensors"])
def get_audio_sensor(sensor_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sensor = db.query(mm.AudioSensor).filter(mm.AudioSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Audio sensor not found")
    return _attach_site_name(sensor)


@router.put("/audio-sensors/{sensor_id}", response_model=sm.AudioSensorOut, tags=["Audio Sensors"])
def update_audio_sensor(sensor_id: int, payload: sm.AudioSensorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    sensor = db.query(mm.AudioSensor).filter(mm.AudioSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Audio sensor not found")
    for k, v in payload.model_dump().items():
        setattr(sensor, k, v)
    db.commit()
    db.refresh(sensor)
    return _attach_site_name(sensor)


@router.delete("/audio-sensors/{sensor_id}", status_code=204, tags=["Audio Sensors"])
def delete_audio_sensor(sensor_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_only)):
    sensor = db.query(mm.AudioSensor).filter(mm.AudioSensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Audio sensor not found")
    db.delete(sensor)
    db.commit()
    return None


# =================================================================
# SURVEYS
# =================================================================
@router.post("/surveys", response_model=sm.SurveyOut, status_code=201, tags=["Surveys"])
def create_survey(payload: sm.SurveyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    _site_or_404(db, payload.monitoring_site_id)
    survey = mm.Survey(**payload.model_dump(), created_by_id=current_user.id)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return _attach_survey_extras(survey)


@router.get("/surveys", response_model=list[sm.SurveyOut], tags=["Surveys"])
def list_surveys(
    search: Optional[str] = None,
    site_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    habitat_type: Optional[mm.HabitatType] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(mm.Survey).join(mm.MonitoringSite)
    if search:
        q = q.filter(mm.Survey.survey_name.ilike(f"%{search}%"))
    if site_id:
        q = q.filter(mm.Survey.monitoring_site_id == site_id)
    if date_from:
        q = q.filter(mm.Survey.survey_date >= date_from)
    if date_to:
        q = q.filter(mm.Survey.survey_date <= date_to)
    if habitat_type:
        q = q.filter(mm.MonitoringSite.habitat_type == habitat_type)
    surveys = q.order_by(mm.Survey.survey_date.desc()).all()
    return [_attach_survey_extras(s) for s in surveys]


@router.get("/surveys/{survey_id}", response_model=sm.SurveyOut, tags=["Surveys"])
def get_survey(survey_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    survey = db.query(mm.Survey).filter(mm.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return _attach_survey_extras(survey)


@router.put("/surveys/{survey_id}", response_model=sm.SurveyOut, tags=["Surveys"])
def update_survey(survey_id: int, payload: sm.SurveyUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_site_infra)):
    survey = db.query(mm.Survey).filter(mm.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    for k, v in payload.model_dump().items():
        setattr(survey, k, v)
    db.commit()
    db.refresh(survey)
    return _attach_survey_extras(survey)


@router.delete("/surveys/{survey_id}", status_code=204, tags=["Surveys"])
def delete_survey(survey_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_only)):
    survey = db.query(mm.Survey).filter(mm.Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    db.delete(survey)
    db.commit()
    return None


# =================================================================
# OBSERVATIONS
# =================================================================
@router.post("/observations", response_model=sm.ObservationOut, status_code=201, tags=["Observations"])
def create_observation(payload: sm.ObservationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_observations)):
    _site_or_404(db, payload.monitoring_site_id)
    obs = mm.Observation(**payload.model_dump(), created_by_id=current_user.id)
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return _attach_obs_extras(obs)


@router.get("/observations", response_model=list[sm.ObservationOut], tags=["Observations"])
def list_observations(
    species: Optional[str] = None,
    site_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    detection_source: Optional[mm.DetectionSource] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(mm.Observation)
    if species:
        q = q.filter(mm.Observation.species.ilike(f"%{species}%"))
    if site_id:
        q = q.filter(mm.Observation.monitoring_site_id == site_id)
    if date_from:
        q = q.filter(mm.Observation.observation_datetime >= date_from)
    if date_to:
        q = q.filter(mm.Observation.observation_datetime <= date_to)
    if detection_source:
        q = q.filter(mm.Observation.detection_source == detection_source)
    obs_list = q.order_by(mm.Observation.observation_datetime.desc()).all()
    return [_attach_obs_extras(o) for o in obs_list]


@router.get("/observations/{obs_id}", response_model=sm.ObservationOut, tags=["Observations"])
def get_observation(obs_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    obs = db.query(mm.Observation).filter(mm.Observation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    return _attach_obs_extras(obs)


@router.put("/observations/{obs_id}", response_model=sm.ObservationOut, tags=["Observations"])
def update_observation(obs_id: int, payload: sm.ObservationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(manage_observations)):
    obs = db.query(mm.Observation).filter(mm.Observation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    for k, v in payload.model_dump().items():
        setattr(obs, k, v)
    db.commit()
    db.refresh(obs)
    return _attach_obs_extras(obs)


@router.delete("/observations/{obs_id}", status_code=204, tags=["Observations"])
def delete_observation(obs_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(admin_only)):
    obs = db.query(mm.Observation).filter(mm.Observation.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    db.delete(obs)
    db.commit()
    return None


# =================================================================
# DASHBOARD STATS
# =================================================================
@router.get("/monitoring/stats", response_model=sm.MonitoringStats, tags=["Monitoring Stats"])
def get_monitoring_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return sm.MonitoringStats(
        total_surveys=db.query(mm.Survey).count(),
        total_monitoring_sites=db.query(mm.MonitoringSite).count(),
        active_camera_traps=db.query(mm.CameraTrap).filter(mm.CameraTrap.status == mm.DeviceStatus.active).count(),
        active_audio_sensors=db.query(mm.AudioSensor).filter(mm.AudioSensor.status == mm.DeviceStatus.active).count(),
        total_observations=db.query(mm.Observation).count(),
    )
