"""
Basic smoke tests for the auth flow.
Run with: pytest (requires a test database configured via DATABASE_URL)
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_and_login():
    register_payload = {
        "full_name": "Test Researcher",
        "email": "test.researcher@example.com",
        "password": "StrongPassword123!",
        "role": "wildlife_researcher",
    }
    reg_response = client.post("/api/v1/auth/register", json=register_payload)
    assert reg_response.status_code in (201, 400)  # 400 if already registered from a prior run

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
