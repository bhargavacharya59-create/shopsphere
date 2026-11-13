"""Tests for authentication endpoints."""
import pytest

TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "testpass123"


def test_register_user(client):
    resp = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "password123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    # password must NOT appear in response
    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]


def test_register_duplicate_email(client, registered_user):
    """Registering with the same email as an existing user should return 409."""
    resp = client.post("/api/auth/register", json={
        "email": TEST_EMAIL,  # already registered by registered_user fixture
        "full_name": "Duplicate",
        "password": "password123",
    })
    assert resp.status_code == 409


def test_login_valid(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password",
    })
    assert resp.status_code == 401


def test_get_me_authenticated(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == TEST_EMAIL
    assert "hashed_password" not in data


def test_get_me_unauthenticated(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code in (401, 403)


def test_short_password_rejected(client):
    resp = client.post("/api/auth/register", json={
        "email": "short@example.com",
        "full_name": "Short Pass",
        "password": "abc",
    })
    assert resp.status_code == 422
