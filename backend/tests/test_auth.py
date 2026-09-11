def test_register_and_login(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Officer",
            "email": "officer.pytest@wildlife.org",
            "password": "Testing@12345",
            "role": "conservation_officer",
        },
    )
    assert res.status_code == 201
    assert res.json()["role"] == "conservation_officer"

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "officer.pytest@wildlife.org", "password": "Testing@12345"},
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body and "refresh_token" in body


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Wrong Pw",
            "email": "wrongpw.pytest@wildlife.org",
            "password": "Correct@12345",
            "role": "researcher",
        },
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw.pytest@wildlife.org", "password": "Incorrect@1"},
    )
    assert res.status_code == 401


def test_protected_endpoint_requires_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_me_returns_authenticated_user(client, registered_user):
    res = client.get("/api/v1/auth/me", headers=registered_user)
    assert res.status_code == 200
    assert res.json()["email"] == "pytest.researcher@wildlife.org"


def test_admin_only_route_rejects_researcher(client, registered_user):
    res = client.get("/api/v1/users/", headers=registered_user)
    assert res.status_code == 403
