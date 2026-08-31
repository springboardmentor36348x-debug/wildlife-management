from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audio_sensor import AudioSensor
from app.models.monitoring_site import MonitoringSite
from app.models.survey import Survey
from app.schemas.audio_sensor import AudioSensorCreate, AudioSensorResponse
from app.models.user import User
from app.core.permissions import require_role
from app.api.deps import get_current_user   
router = APIRouter(prefix="/audio-sensors", tags=["Audio Sensor Management"])


# ✅ CREATE
@router.post("/", response_model=AudioSensorResponse)
def create_audio_sensor(
    sensor_data: AudioSensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["wildlife_researcher", "administrator"]))
):
    site = db.query(MonitoringSite).filter(
        MonitoringSite.id == sensor_data.monitoring_site_id
    ).first()

    if not site:
        raise HTTPException(status_code=404, detail="Monitoring site not found")

    survey = db.query(Survey).filter(Survey.id == site.survey_id).first()

    if current_user.role != "administrator" and survey.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_sensor = AudioSensor(**sensor_data.dict())

    db.add(new_sensor)
    db.commit()
    db.refresh(new_sensor)

    return new_sensor


# ✅ LIST
@router.get("/", response_model=list[AudioSensorResponse])
def list_audio_sensors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["administrator", "conservation_officer", "forest_officer"]:
        return db.query(AudioSensor).all()

    return db.query(AudioSensor).join(
        MonitoringSite, AudioSensor.monitoring_site_id == MonitoringSite.id
    ).join(
        Survey, MonitoringSite.survey_id == Survey.id
    ).filter(
        Survey.created_by == current_user.id
    ).all()