"""
Milestone 4 Part A Automated Integration & Verification Tests:
- Reports & Export System (PDF & Excel generation for all 5 report types, download, history)
- Field Incidents Management CRUD
- Habitat Restoration Action Status Tracking
- GIS GeoJSON Layers (Sensors, Species Distribution, Habitat, Health Scores, Migration, Protected Areas)
- Admin Platform Analytics, Hardware Device Monitoring, and User Administration
- Real-time Threat Alerts
"""
import io
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole
from app.models.survey import Survey, MonitoringSite, SurveyStatus, HabitatType, MonitoringDevice
from app.models.observation import Observation, ObservationType
from app.models.incident import Incident, IncidentType, IncidentSeverity, IncidentStatus, ActionStatus, ReportType, ReportFormat


TEST_DB_URL = "sqlite:///./test_milestone4.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Create test users for all 4 roles
    admin = User(
        id="test-admin-id",
        full_name="Admin Test",
        email="admin_test@wildlife.org",
        hashed_password=hash_password("Pass@123"),
        role=UserRole.ADMINISTRATOR,
        organization="WPIS Admin",
        is_active=True,
    )
    researcher = User(
        id="test-researcher-id",
        full_name="Researcher Test",
        email="researcher_test@wildlife.org",
        hashed_password=hash_password("Pass@123"),
        role=UserRole.RESEARCHER,
        organization="WPIS Research",
        is_active=True,
    )
    officer = User(
        id="test-officer-id",
        full_name="Officer Test",
        email="officer_test@wildlife.org",
        hashed_password=hash_password("Pass@123"),
        role=UserRole.CONSERVATION_OFFICER,
        organization="WPIS Conservation",
        is_active=True,
    )
    forest = User(
        id="test-forest-id",
        full_name="Forest Officer Test",
        email="forest_test@wildlife.org",
        hashed_password=hash_password("Pass@123"),
        role=UserRole.FOREST_DEPARTMENT,
        organization="WPIS Forest",
        is_active=True,
    )
    db.add_all([admin, researcher, officer, forest])
    db.commit()

    # Create test survey and sites
    survey = Survey(
        id="test-survey-01",
        name="Serengeti Test Census",
        description="Integration test survey",
        protected_area="Serengeti NP",
        status=SurveyStatus.ACTIVE,
        start_date=admin.created_at,
        created_by=admin.id,
    )
    db.add(survey)
    db.commit()

    site1 = MonitoringSite(
        id="test-site-01",
        survey_id=survey.id,
        site_name="North Gate Sensor",
        latitude=-2.33,
        longitude=34.83,
        habitat_type=HabitatType.FOREST,
        monitoring_device=MonitoringDevice.CAMERA_TRAP,
        protected_area="Serengeti NP",
        is_active="true",
    )
    site2 = MonitoringSite(
        id="test-site-02",
        survey_id=survey.id,
        site_name="River Crossing Sensor",
        latitude=-2.20,
        longitude=34.30,
        habitat_type=HabitatType.RIVERINE,
        monitoring_device=MonitoringDevice.AUDIO_SENSOR,
        protected_area="Serengeti NP",
        is_active="true",
    )
    db.add_all([site1, site2])
    db.commit()

    # Add observations
    obs1 = Observation(
        id="test-obs-01",
        site_id=site1.id,
        observation_type=ObservationType.IMAGE,
        file_reference="/uploads/test1.jpg",
        species_label="elephant",
        confidence_score=0.95,
        captured_at=admin.created_at,
    )
    obs2 = Observation(
        id="test-obs-02",
        site_id=site2.id,
        observation_type=ObservationType.AUDIO,
        file_reference="/uploads/test2.wav",
        species_label="bird",
        confidence_score=0.88,
        captured_at=admin.created_at,
    )
    db.add_all([obs1, obs2])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_milestone4.db"):
        try:
            os.remove("./test_milestone4.db")
        except OSError:
            pass


def get_auth_header(user_id: str, role: str) -> dict:
    token = create_access_token(subject=user_id, extra_claims={"role": role})
    return {"Authorization": f"Bearer {token}"}


# ================= 1. REPORT GENERATION & EXPORT TESTS =================

@pytest.mark.parametrize("report_type", [
    "wildlife_survey",
    "species_population",
    "biodiversity",
    "habitat_assessment",
    "conservation",
])
def test_generate_pdf_reports(report_type):
    """Verifies that all 5 report types generate valid PDF documents."""
    headers = get_auth_header("test-researcher-id", "researcher")
    payload = {
        "title": f"Test {report_type} PDF",
        "report_type": report_type,
        "format": "pdf",
    }
    response = client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["report_type"] == report_type
    assert data["file_format"] == "pdf"
    assert data["file_size_bytes"] > 0
    assert data["download_url"].startswith("/api/v1/reports/")

    # Test Download
    report_id = data["id"]
    dl_response = client.get(f"/api/v1/reports/{report_id}/download", headers=headers)
    assert dl_response.status_code == 200
    assert dl_response.headers["content-type"] == "application/pdf"
    assert dl_response.content.startswith(b"%PDF-")


@pytest.mark.parametrize("report_type", [
    "wildlife_survey",
    "species_population",
    "biodiversity",
    "habitat_assessment",
    "conservation",
])
def test_generate_excel_reports(report_type):
    """Verifies that all 5 report types generate valid multi-sheet Excel workbooks."""
    headers = get_auth_header("test-admin-id", "administrator")
    payload = {
        "title": f"Test {report_type} Excel",
        "report_type": report_type,
        "format": "excel",
    }
    response = client.post("/api/v1/reports/generate", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["report_type"] == report_type
    assert data["file_format"] == "excel"
    assert data["file_size_bytes"] > 0

    # Test Download
    report_id = data["id"]
    dl_response = client.get(f"/api/v1/reports/{report_id}/download", headers=headers)
    assert dl_response.status_code == 200
    assert "spreadsheetml.sheet" in dl_response.headers["content-type"]
    assert dl_response.content[:4] == b"PK\x03\x04"  # standard ZIP/XLSX magic bytes


def test_reports_history_and_types():
    headers = get_auth_header("test-researcher-id", "researcher")
    
    # Types
    types_res = client.get("/api/v1/reports/types", headers=headers)
    assert types_res.status_code == 200
    types = types_res.json()
    assert len(types) == 5
    assert {t["type"] for t in types} == {
        "wildlife_survey", "species_population", "biodiversity", "habitat_assessment", "conservation"
    }

    # History
    hist_res = client.get("/api/v1/reports/history", headers=headers)
    assert hist_res.status_code == 200
    assert isinstance(hist_res.json(), list)
    assert len(hist_res.json()) > 0


# ================= 2. FIELD INCIDENT MANAGEMENT CRUD TESTS =================

def test_incident_crud_lifecycle():
    forest_headers = get_auth_header("test-forest-id", "forest_department")

    # 1. Create Incident
    create_payload = {
        "title": "Suspected snare line detected",
        "description": "2 wire snares neutralized near North Gate",
        "incident_type": "poaching",
        "severity": "high",
        "status": "open",
        "site_id": "test-site-01",
        "actions_taken": "Snares removed; patrol increased",
    }
    res = client.post("/api/v1/incidents/", json=create_payload, headers=forest_headers)
    assert res.status_code == 201
    created = res.json()
    inc_id = created["id"]
    assert created["title"] == create_payload["title"]
    assert created["site_name"] == "North Gate Sensor"
    assert created["status"] == "open"

    # 2. List Incidents
    list_res = client.get("/api/v1/incidents/", headers=forest_headers)
    assert list_res.status_code == 200
    assert any(i["id"] == inc_id for i in list_res.json())

    # 3. Get Single Incident
    get_res = client.get(f"/api/v1/incidents/{inc_id}", headers=forest_headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == create_payload["title"]

    # 4. Update Incident Status
    update_res = client.patch(
        f"/api/v1/incidents/{inc_id}",
        json={"status": "in_progress", "actions_taken": "Dispatched thermal surveillance team"},
        headers=forest_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "in_progress"
    assert update_res.json()["actions_taken"] == "Dispatched thermal surveillance team"

    # 5. Delete Incident
    del_res = client.delete(f"/api/v1/incidents/{inc_id}", headers=forest_headers)
    assert del_res.status_code == 204


# ================= 3. RESTORATION ACTION TRACKING TESTS =================

def test_restoration_action_tracking():
    officer_headers = get_auth_header("test-officer-id", "conservation_officer")

    # Get restoration suggestions for site
    res = client.get("/api/v1/conservation/restoration/test-site-01", headers=officer_headers)
    assert res.status_code == 200
    actions = res.json()
    assert isinstance(actions, list)

    # If action exists, test updating status
    if actions:
        action_id = actions[0]["id"]
        patch_res = client.patch(
            f"/api/v1/conservation/restoration/{action_id}/status",
            json={"status": "in_progress", "notes": "Field ranger assigned"},
            headers=officer_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "in_progress"
        assert patch_res.json()["notes"] == "Field ranger assigned"


# ================= 4. GIS GEOJSON LAYER TESTS =================

def test_gis_geojson_endpoints():
    headers = get_auth_header("test-researcher-id", "researcher")

    # 1. Sensors Layer
    res = client.get("/api/v1/gis/sensors", headers=headers)
    assert res.status_code == 200
    geojson = res.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 2

    # 2. Species Distribution Layer
    res = client.get("/api/v1/gis/species-distribution", headers=headers)
    assert res.status_code == 200
    assert res.json()["type"] == "FeatureCollection"

    # 3. Habitat Zones Layer
    res = client.get("/api/v1/gis/habitat-zones", headers=headers)
    assert res.status_code == 200
    assert res.json()["type"] == "FeatureCollection"

    # 4. Health Scores Layer
    res = client.get("/api/v1/gis/health-scores", headers=headers)
    assert res.status_code == 200
    assert res.json()["type"] == "FeatureCollection"

    # 5. Migration Paths Layer
    res = client.get("/api/v1/gis/migration-paths?species=elephant", headers=headers)
    assert res.status_code == 200
    assert res.json()["type"] == "FeatureCollection"

    # 6. All Layers Bundle
    res = client.get("/api/v1/gis/all-layers", headers=headers)
    assert res.status_code == 200
    bundle = res.json()
    assert "sensors" in bundle
    assert "habitat_zones" in bundle
    assert "health_scores" in bundle


# ================= 5. ADMIN PLATFORM & HARDWARE MONITORING TESTS =================

def test_admin_platform_and_hardware_endpoints():
    admin_headers = get_auth_header("test-admin-id", "administrator")
    researcher_headers = get_auth_header("test-researcher-id", "researcher")

    # Analytics
    analytics_res = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert analytics_res.status_code == 200
    a = analytics_res.json()
    assert a["active_users"] >= 4
    assert a["total_surveys"] >= 1
    assert "system_status" in a

    # RBAC Guard - Non-admin cannot access admin analytics
    forbidden_res = client.get("/api/v1/admin/analytics", headers=researcher_headers)
    assert forbidden_res.status_code == 403

    # Device hardware fleet
    devices_res = client.get("/api/v1/admin/devices", headers=admin_headers)
    assert devices_res.status_code == 200
    devs = devices_res.json()
    assert "summary" in devs
    assert len(devs["devices"]) == 2

    # Admin User Provisioning
    user_payload = {
        "full_name": "New Ranger",
        "email": "new_ranger@wildlife.org",
        "password": "RangerPass@123",
        "role": "forest_department",
        "organization": "Serengeti Field Team",
    }
    user_res = client.post("/api/v1/admin/users", json=user_payload, headers=admin_headers)
    assert user_res.status_code == 201
    assert user_res.json()["email"] == "new_ranger@wildlife.org"


# ================= 6. CONSERVATION THREAT ALERTS TESTS =================

def test_conservation_threats_endpoint():
    officer_headers = get_auth_header("test-officer-id", "conservation_officer")
    res = client.get("/api/v1/conservation/threats", headers=officer_headers)
    assert res.status_code == 200
    threats = res.json()
    assert isinstance(threats, list)
