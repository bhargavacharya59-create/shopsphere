"""Tests for system health endpoints."""


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "shopsphere"


def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    # Prometheus text format
    assert b"shopsphere" in response.content or b"python" in response.content
