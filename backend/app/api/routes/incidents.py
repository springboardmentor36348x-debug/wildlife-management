"""
Incidents API Router (Milestone 4 Forest Department & Conservation Officer).
Full CRUD for field incident logging (poaching, human-wildlife conflict, tampering, fire).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_roles, get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.survey import MonitoringSite, Survey
from app.models.incident import Incident, IncidentSeverity, IncidentStatus, IncidentType
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentOut

router = APIRouter(prefix="/incidents", tags=["Incidents & Field Security"])

CAN_MANAGE_INCIDENTS = (
    UserRole.ADMINISTRATOR,
    UserRole.FOREST_DEPARTMENT,
    UserRole.CONSERVATION_OFFICER,
    UserRole.RESEARCHER,
)


@router.post("/", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE_INCIDENTS)),
):
    """Creates a new field incident report."""
    lat = payload.latitude
    lon = payload.longitude

    if payload.site_id:
        site = db.query(MonitoringSite).filter(MonitoringSite.id == payload.site_id).first()
        if not site:
            raise HTTPException(status_code=404, detail="Monitoring site not found.")
        if lat is None:
            lat = site.latitude
        if lon is None:
            lon = site.longitude
        if not payload.survey_id:
            payload.survey_id = site.survey_id

    if payload.survey_id:
        survey = db.query(Survey).filter(Survey.id == payload.survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found.")

    incident = Incident(
        title=payload.title,
        description=payload.description,
        incident_type=payload.incident_type,
        severity=payload.severity,
        status=payload.status,
        site_id=payload.site_id,
        survey_id=payload.survey_id,
        latitude=lat,
        longitude=lon,
        reported_by=current_user.id,
        alert_id=payload.alert_id,
        actions_taken=payload.actions_taken,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    return _to_incident_out(incident)


@router.get("/", response_model=list[IncidentOut])
def list_incidents(
    site_id: str | None = None,
    survey_id: str | None = None,
    incident_type: IncidentType | None = None,
    severity: IncidentSeverity | None = None,
    incident_status: IncidentStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists all logged incidents with optional filtering."""
    query = db.query(Incident)
    if site_id:
        query = query.filter(Incident.site_id == site_id)
    if survey_id:
        query = query.filter(Incident.survey_id == survey_id)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    if severity:
        query = query.filter(Incident.severity == severity)
    if incident_status:
        query = query.filter(Incident.status == incident_status)

    incidents = query.order_by(Incident.reported_at.desc()).all()
    return [_to_incident_out(i) for i in incidents]


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves an incident by ID."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found.")
    return _to_incident_out(incident)


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: str,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*CAN_MANAGE_INCIDENTS)),
):
    """Updates incident status, actions taken, or details."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(incident, field, val)

    db.commit()
    db.refresh(incident)
    return _to_incident_out(incident)


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMINISTRATOR, UserRole.FOREST_DEPARTMENT)),
):
    """Deletes an incident record."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found.")
    db.delete(incident)
    db.commit()


def _to_incident_out(i: Incident) -> IncidentOut:
    return IncidentOut(
        id=i.id,
        title=i.title,
        description=i.description,
        incident_type=i.incident_type,
        severity=i.severity,
        status=i.status,
        site_id=i.site_id,
        site_name=i.site.site_name if i.site else None,
        survey_id=i.survey_id,
        survey_name=i.survey.name if i.survey else None,
        latitude=i.latitude,
        longitude=i.longitude,
        reported_by=i.reported_by,
        reporter_name=i.reporter.full_name if i.reporter else None,
        reported_at=i.reported_at,
        alert_id=i.alert_id,
        actions_taken=i.actions_taken,
    )
