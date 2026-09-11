from datetime import datetime, timezone


def _create_survey_and_site(client, headers):
    res = client.post(
        "/api/v1/surveys/",
        headers=headers,
        json={
            "name": "Pytest Survey",
            "protected_area": "Pytest Reserve",
            "start_date": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert res.status_code in (200, 201), res.text
    survey = res.json()

    res = client.post(
        "/api/v1/surveys/sites",
        headers=headers,
        json={
            "survey_id": survey["id"],
            "site_name": "Pytest Site A",
            "latitude": -2.33,
            "longitude": 34.82,
            "habitat_type": "grassland",
            "monitoring_device": "camera_trap",
        },
    )
    assert res.status_code in (200, 201), res.text
    return survey, res.json()


def test_create_survey_and_site(client, registered_user):
    survey, site = _create_survey_and_site(client, registered_user)
    assert site["survey_id"] == survey["id"]

    res = client.get("/api/v1/surveys/sites/all", headers=registered_user)
    assert res.status_code == 200
    assert any(s["id"] == site["id"] for s in res.json())


def test_population_counts_empty_is_ok(client, registered_user):
    res = client.get("/api/v1/population/counts", headers=registered_user)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_health_score_all_sites(client, registered_user):
    _create_survey_and_site(client, registered_user)
    res = client.get("/api/v1/health/score/all-sites", headers=registered_user)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_notifications_sync_and_read(client, registered_user):
    res = client.get("/api/v1/notifications/", headers=registered_user)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    res = client.get("/api/v1/notifications/summary", headers=registered_user)
    assert res.status_code == 200
    body = res.json()
    assert set(["total", "unread", "critical", "warning", "info"]).issubset(body.keys())


def test_performance_metrics_shape(client, registered_user):
    res = client.get("/api/v1/performance/metrics", headers=registered_user)
    assert res.status_code == 200
    body = res.json()
    assert "system_performance" in body
    assert "species_recognition" in body
    assert "bioacoustic" in body


def test_reports_summary(client, registered_user):
    res = client.get("/api/v1/reports/summary", headers=registered_user)
    assert res.status_code == 200
    body = res.json()
    assert "images_analyzed" in body


def test_reports_export_pdf_and_excel(client, registered_user):
    res = client.post(
        "/api/v1/reports/generate",
        headers=registered_user,
        json={"title": "Pytest Diversity Audit", "report_type": "population", "region": "Pytest Reserve"},
    )
    assert res.status_code == 200, res.text
    report_id = res.json()["id"]

    res_pdf = client.get(f"/api/v1/reports/export/{report_id}?format=pdf", headers=registered_user)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"

    res_xlsx = client.get(f"/api/v1/reports/export/{report_id}?format=excel", headers=registered_user)
    assert res_xlsx.status_code == 200
    assert "spreadsheetml" in res_xlsx.headers["content-type"]


def test_reports_export_bad_format_rejected(client, registered_user):
    res = client.get("/api/v1/reports/export-type/population?format=csv", headers=registered_user)
    assert res.status_code == 400
