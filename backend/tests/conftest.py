"""
Milestone 4 - Final Integration, Testing & Deployment (FR-14).

Shared pytest fixtures. Uses an isolated in-memory SQLite database (not
your real wildlife.db) so running the test suite never touches your
local dev data. The FastAPI app's `get_db` dependency is overridden to
point at this test database for the lifetime of the test session.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.main import app  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app import models  # noqa: E402,F401

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(scope="session", autouse=True)
def _create_test_schema():
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def registered_user(client):
    """Registers and logs in a fresh researcher account, returns (headers, user_json)."""
    email = "pytest.researcher@wildlife.org"
    password = "Testing@12345"
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Pytest Researcher",
            "email": email,
            "password": password,
            "role": "researcher",
        },
    )
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
