"""Tests for the failure simulation endpoints (dev-only).

ENABLE_FAILURE_SIMULATION=true is set in conftest.py environment setup.
"""
import pytest
from app.services.failure_simulator import FailureSimulator


def test_simulation_status_available_in_dev(client):
    resp = client.get("/api/dev/simulate/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "active_scenarios" in data
    assert "simulation_enabled" in data


def test_simulation_activate_payment_failure(client):
    """Activate payment failure simulation."""
    # Ensure clean state
    FailureSimulator.reset_all()

    resp = client.post("/api/dev/simulate/payment-failure")
    assert resp.status_code == 200
    data = resp.json()
    assert data["active"] is True
    assert data["scenario"] == "payment"

    # Verify it shows in status
    status_resp = client.get("/api/dev/simulate/status")
    assert "payment" in status_resp.json()["active_scenarios"]

    # Clean up
    FailureSimulator.reset_all()


def test_simulation_activate_db_latency(client):
    FailureSimulator.reset_all()

    resp = client.post("/api/dev/simulate/db-latency", json={"delay_seconds": 0.01})
    assert resp.status_code == 200
    assert resp.json()["active"] is True

    FailureSimulator.reset_all()


def test_simulation_activate_error_spike(client):
    FailureSimulator.reset_all()
    resp = client.post("/api/dev/simulate/error-spike")
    assert resp.status_code == 200
    FailureSimulator.reset_all()


def test_simulation_activate_order_service_failure(client):
    FailureSimulator.reset_all()
    resp = client.post("/api/dev/simulate/order-service")
    assert resp.status_code == 200
    FailureSimulator.reset_all()


def test_simulation_reset(client):
    """Reset clears all active scenarios."""
    FailureSimulator.activate("payment")
    FailureSimulator.activate("db_latency", {"delay_seconds": 1})

    resp = client.post("/api/dev/simulate/reset")
    assert resp.status_code == 200
    cleared = resp.json()["cleared_scenarios"]
    assert "payment" in cleared
    assert "db_latency" in cleared

    # Status should show empty after reset
    status = client.get("/api/dev/simulate/status").json()
    assert status["active_scenarios"] == {}


def test_should_fail_logic():
    """Unit test: FailureSimulator.should_fail() returns correct state."""
    FailureSimulator.reset_all()
    assert FailureSimulator.should_fail("payment") is False

    FailureSimulator.activate("payment")
    assert FailureSimulator.should_fail("payment") is True

    FailureSimulator.deactivate("payment")
    assert FailureSimulator.should_fail("payment") is False
