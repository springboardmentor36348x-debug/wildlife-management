"""
One-off seed script for local/dev setup.

Run with:  python -m app.seed

Creates:
  - Default users for all 4 roles (Admin, Researcher, Conservation Officer, Forest Dept)
  - Demo Surveys and Monitoring Sites across multiple protected areas
  - Demo Observations with detected species labels for instant analytics
  - Demo Field Incidents for Forest Department and Conservation Officer dashboards
  - Dataset registry entries for the 5 datasets recommended in the spec

Safe to re-run: skips anything that already exists.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path so running directly works
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timezone, timedelta
import uuid

from app.db.session import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.survey import Survey, MonitoringSite, SurveyStatus, HabitatType, MonitoringDevice
from app.models.observation import Observation, ObservationType, Dataset, DatasetSource, DatasetStatus
from app.models.incident import Incident, IncidentType, IncidentSeverity, IncidentStatus

Base.metadata.create_all(bind=engine)

DEMO_USERS = [
    ("System Administrator", "admin@wildlife.org", "Admin@12345", UserRole.ADMINISTRATOR),
    ("Dr. Amara Singh", "researcher@wildlife.org", "Research@12345", UserRole.RESEARCHER),
    ("Officer Kevin Otieno", "officer@wildlife.org", "Officer@12345", UserRole.CONSERVATION_OFFICER),
    ("Warden Priya Nair", "forest@wildlife.org", "Forest@12345", UserRole.FOREST_DEPARTMENT),
]

DEMO_DATASETS = [
    ("Snapshot Serengeti", DatasetSource.SNAPSHOT_SERENGETI,
     "Wildlife species detection / camera trap image classification", 1_200_000),
    ("iNaturalist Mini", DatasetSource.INATURALIST,
     "Species classification / biodiversity recognition", 500_000),
    ("BirdCLEF", DatasetSource.BIRDCLEF,
     "Bird sound recognition / bioacoustic classification", 300_000),
    ("GBIF Occurrence Records", DatasetSource.GBIF,
     "Species occurrence records / biodiversity analysis", 900_000),
    ("Animal Kingdom Dataset", DatasetSource.ANIMAL_KINGDOM,
     "Animal image recognition / species identification", 150_000),
]

DEMO_SURVEYS = [
    {
        "id": "survey-serengeti-01",
        "name": "Serengeti Central Corridor Census",
        "description": "Longitudinal apex predator and herbivore migration tracking survey.",
        "protected_area": "Serengeti National Park",
        "status": SurveyStatus.ACTIVE,
        "days_ago": 60,
    },
    {
        "id": "survey-ngorongoro-02",
        "name": "Ngorongoro Crater Biodiversity Survey",
        "description": "Highland crater basin ecosystem resilience and bioacoustic monitoring.",
        "protected_area": "Ngorongoro Conservation Area",
        "status": SurveyStatus.ACTIVE,
        "days_ago": 90,
    },
    {
        "id": "survey-tarangire-03",
        "name": "Tarangire Riverine Elephant Corridor",
        "description": "Dry season riverine corridor elephant population estimation.",
        "protected_area": "Tarangire National Park",
        "status": SurveyStatus.PLANNED,
        "days_ago": 15,
    },
]

DEMO_SITES = [
    {
        "id": "site-serengeti-north",
        "survey_id": "survey-serengeti-01",
        "site_name": "Serengeti North Ridge Cam 1",
        "latitude": -2.3333,
        "longitude": 34.8333,
        "habitat_type": HabitatType.SAVANNA if hasattr(HabitatType, "SAVANNA") else HabitatType.GRASSLAND,
        "monitoring_device": MonitoringDevice.CAMERA_TRAP,
        "protected_area": "Serengeti National Park",
        "observations": [
            ("zebra", 0.94, ObservationType.IMAGE, 2),
            ("elephant", 0.91, ObservationType.IMAGE, 5),
            ("lion", 0.88, ObservationType.IMAGE, 10),
            ("bird", 0.82, ObservationType.AUDIO, 12),
        ],
    },
    {
        "id": "site-serengeti-river",
        "survey_id": "survey-serengeti-01",
        "site_name": "Grumeti River Crossing Node",
        "latitude": -2.1833,
        "longitude": 34.2000,
        "habitat_type": HabitatType.RIVERINE,
        "monitoring_device": MonitoringDevice.CAMERA_TRAP,
        "protected_area": "Serengeti National Park",
        "observations": [
            ("elephant", 0.96, ObservationType.IMAGE, 1),
            ("zebra", 0.89, ObservationType.IMAGE, 4),
            ("bird", 0.85, ObservationType.AUDIO, 7),
        ],
    },
    {
        "id": "site-ngorongoro-basin",
        "survey_id": "survey-ngorongoro-02",
        "site_name": "Lerai Forest Acoustic Node",
        "latitude": -3.2000,
        "longitude": 35.5833,
        "habitat_type": HabitatType.FOREST,
        "monitoring_device": MonitoringDevice.AUDIO_SENSOR,
        "protected_area": "Ngorongoro Conservation Area",
        "observations": [
            ("bird", 0.95, ObservationType.AUDIO, 1),
            ("bird", 0.91, ObservationType.AUDIO, 3),
            ("elephant", 0.87, ObservationType.IMAGE, 8),
            ("leopard", 0.79, ObservationType.IMAGE, 20),
        ],
    },
    {
        "id": "site-tarangire-marsh",
        "survey_id": "survey-tarangire-03",
        "site_name": "Silale Swamps Observation Post",
        "latitude": -3.8333,
        "longitude": 36.0000,
        "habitat_type": HabitatType.WETLAND,
        "monitoring_device": MonitoringDevice.DRONE,
        "protected_area": "Tarangire National Park",
        "observations": [
            ("elephant", 0.93, ObservationType.IMAGE, 2),
            ("frog", 0.84, ObservationType.AUDIO, 4),
            ("bird", 0.89, ObservationType.AUDIO, 6),
        ],
    },
]

DEMO_INCIDENTS = [
    {
        "title": "Wire Snare Recovered near North Ridge Boundary",
        "description": "Ranger patrol located and deactivated 3 illegal wire snares along the park perimeter fence.",
        "incident_type": IncidentType.POACHING,
        "severity": IncidentSeverity.HIGH,
        "status": IncidentStatus.IN_PROGRESS,
        "site_id": "site-serengeti-north",
        "survey_id": "survey-serengeti-01",
        "latitude": -2.3320,
        "longitude": 34.8310,
        "actions_taken": "Snares seized for evidence; night patrol scheduled with thermal imaging.",
    },
    {
        "title": "Crop Raiding Alert - Village Buffer Zone",
        "description": "Small elephant herd crossed buffer zone into agricultural periphery.",
        "incident_type": IncidentType.HUMAN_WILDLIFE_CONFLICT,
        "severity": IncidentSeverity.MEDIUM,
        "status": IncidentStatus.RESOLVED,
        "site_id": "site-tarangire-marsh",
        "survey_id": "survey-tarangire-03",
        "latitude": -3.8310,
        "longitude": 36.0020,
        "actions_taken": "Community response unit deployed chili-smoke deterrents; herd guided safely back to corridor.",
    },
    {
        "title": "Camera Trap Solar Panel Damaged",
        "description": "Solar cabling disconnected and lens enclosure scratched on Camera Trap #1.",
        "incident_type": IncidentType.DEVICE_TAMPERING,
        "severity": IncidentSeverity.LOW,
        "status": IncidentStatus.OPEN,
        "site_id": "site-ngorongoro-basin",
        "survey_id": "survey-ngorongoro-02",
        "latitude": -3.2010,
        "longitude": 35.5820,
        "actions_taken": "Replacement cable and armored housing dispatched with weekly supply unit.",
    },
]


def run():
    db = SessionLocal()
    try:
        # 1. Users
        created_users = {}
        for full_name, email, password, role in DEMO_USERS:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    full_name=full_name,
                    email=email,
                    hashed_password=hash_password(password),
                    role=role,
                    organization="Wildlife Population Intelligence System",
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[created] user -> {email} ({role.value})")
            else:
                print(f"[skip] user already exists: {email}")
            created_users[role] = user

        admin_user = created_users[UserRole.ADMINISTRATOR]
        forest_user = created_users.get(UserRole.FOREST_DEPARTMENT, admin_user)

        # 2. Datasets
        for name, source, purpose, count in DEMO_DATASETS:
            if db.query(Dataset).filter(Dataset.name == name).first():
                print(f"[skip] dataset already exists: {name}")
                continue
            ds = Dataset(
                name=name,
                source=source,
                purpose=purpose,
                record_count=count,
                status=DatasetStatus.REGISTERED,
                registered_at=datetime.now(timezone.utc),
            )
            db.add(ds)
            print(f"[created] dataset -> {name}")
        db.commit()

        # 3. Surveys
        now = datetime.now(timezone.utc)
        for s_data in DEMO_SURVEYS:
            if db.query(Survey).filter(Survey.id == s_data["id"]).first():
                print(f"[skip] survey already exists: {s_data['name']}")
                continue
            survey = Survey(
                id=s_data["id"],
                name=s_data["name"],
                description=s_data["description"],
                protected_area=s_data["protected_area"],
                status=s_data["status"],
                start_date=now - timedelta(days=s_data["days_ago"]),
                created_by=admin_user.id,
                created_at=now - timedelta(days=s_data["days_ago"]),
            )
            db.add(survey)
            print(f"[created] survey -> {survey.name}")
        db.commit()

        # 4. Sites & Observations
        for site_data in DEMO_SITES:
            site = db.query(MonitoringSite).filter(MonitoringSite.id == site_data["id"]).first()
            if not site:
                site = MonitoringSite(
                    id=site_data["id"],
                    survey_id=site_data["survey_id"],
                    site_name=site_data["site_name"],
                    latitude=site_data["latitude"],
                    longitude=site_data["longitude"],
                    habitat_type=site_data["habitat_type"],
                    monitoring_device=site_data["monitoring_device"],
                    protected_area=site_data["protected_area"],
                    is_active="true",
                    created_at=now - timedelta(days=45),
                )
                db.add(site)
                db.commit()
                db.refresh(site)
                print(f"[created] site -> {site.site_name}")

            for species, conf, obs_type, days_ago in site_data["observations"]:
                obs_exists = (
                    db.query(Observation)
                    .filter(Observation.site_id == site.id, Observation.species_label == species)
                    .first()
                )
                if not obs_exists:
                    obs = Observation(
                        id=str(uuid.uuid4()),
                        site_id=site.id,
                        observation_type=obs_type,
                        file_reference=f"/uploads/observations/demo_{species}_{obs_type.value}.jpg",
                        species_label=species,
                        confidence_score=conf,
                        captured_at=now - timedelta(days=days_ago),
                        notes=f"Auto-verified high confidence {species} detection",
                    )
                    db.add(obs)
            db.commit()

        # 5. Incidents
        for inc_data in DEMO_INCIDENTS:
            if db.query(Incident).filter(Incident.title == inc_data["title"]).first():
                print(f"[skip] incident already exists: {inc_data['title']}")
                continue
            incident = Incident(
                id=str(uuid.uuid4()),
                title=inc_data["title"],
                description=inc_data["description"],
                incident_type=inc_data["incident_type"],
                severity=inc_data["severity"],
                status=inc_data["status"],
                site_id=inc_data["site_id"],
                survey_id=inc_data["survey_id"],
                latitude=inc_data["latitude"],
                longitude=inc_data["longitude"],
                reported_by=forest_user.id,
                reported_at=now - timedelta(days=3),
                actions_taken=inc_data["actions_taken"],
            )
            db.add(incident)
            print(f"[created] incident -> {incident.title}")
        db.commit()

        print("\nSeed complete. Demo login credentials:")
        for full_name, email, password, role in DEMO_USERS:
            print(f"  {role.value:22s} {email:28s} {password}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
