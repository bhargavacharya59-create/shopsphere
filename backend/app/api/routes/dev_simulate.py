"""
Development-only failure simulation endpoints.
These endpoints are BLOCKED in production environments.

Scenarios available for DevInsight AI demonstration:
- db-latency: Adds artificial delay to database operations
- payment-failure: Makes all payment processing fail with HTTP 500
- error-spike: Causes random 500 errors on product/order requests
- order-service: Makes order creation fail with 503
- cpu-spike: Generates CPU-intensive workload
- memory-spike: Allocates a large memory block
- reset: Clears all active simulation scenarios
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Body
from pydantic import BaseModel

from app.core.config import settings
from app.services.failure_simulator import FailureSimulator
from app.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/dev", tags=["Dev — Failure Simulation"])


def _require_dev():
    """Block access in production. Raises 403 if not in dev/test environment."""
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Failure simulation endpoints are not available in production.",
        )
    if not settings.ENABLE_FAILURE_SIMULATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Set ENABLE_FAILURE_SIMULATION=true to use these endpoints.",
        )


class SimulateRequest(BaseModel):
    delay_seconds: Optional[float] = 3.0
    duration_seconds: Optional[float] = 10.0
    intensity: Optional[float] = 0.8
    chunk_mb: Optional[int] = 50


@router.get("/simulate/status")
def simulation_status():
    """Get current simulation state (available in dev even without flag)."""
    if settings.is_production:
        raise HTTPException(status_code=403, detail="Not available in production.")
    return FailureSimulator.get_status()


@router.post("/simulate/db-latency")
def simulate_db_latency(body: SimulateRequest = Body(default=SimulateRequest())):
    """
    Simulate database latency.
    Products and orders will respond slowly to mimic DB overload.
    DevInsight AI should detect: High database query latency.
    """
    _require_dev()
    return FailureSimulator.activate("db_latency", {"delay_seconds": body.delay_seconds})


@router.post("/simulate/payment-failure")
def simulate_payment_failure():
    """
    Simulate payment service failure.
    All checkout attempts will fail with 'Payment could not be processed'.
    DevInsight AI should detect: Payment API errors.
    """
    _require_dev()
    return FailureSimulator.activate("payment")


@router.post("/simulate/error-spike")
def simulate_error_spike():
    """
    Simulate HTTP 500 error spike.
    Random requests will fail.
    DevInsight AI should detect: Increased server error rate.
    """
    _require_dev()
    return FailureSimulator.activate("error_spike")


@router.post("/simulate/order-service")
def simulate_order_service_failure():
    """
    Simulate order service crash.
    Users cannot place orders — 503 is returned.
    DevInsight AI should detect: Service unavailable.
    """
    _require_dev()
    return FailureSimulator.activate("order_service")


@router.post("/simulate/cpu-spike")
def simulate_cpu_spike(body: SimulateRequest = Body(default=SimulateRequest())):
    """
    Simulate CPU spike.
    Runs a bounded background thread that consumes CPU.
    DevInsight AI should detect: Abnormally high CPU usage.
    """
    _require_dev()
    FailureSimulator.activate("cpu_spike", {"duration": body.duration_seconds})
    FailureSimulator.apply_cpu_spike(body.duration_seconds or 10.0, body.intensity or 0.8)
    return {"scenario": "cpu_spike", "duration_seconds": body.duration_seconds, "active": True}


@router.post("/simulate/memory-spike")
def simulate_memory_spike(body: SimulateRequest = Body(default=SimulateRequest())):
    """
    Simulate memory spike (max 200MB).
    DevInsight AI should detect: Increasing memory usage.
    """
    _require_dev()
    FailureSimulator.activate("memory_leak", {"chunk_mb": body.chunk_mb})
    FailureSimulator.apply_memory_leak(body.chunk_mb or 50)
    return {"scenario": "memory_leak", "chunk_mb": body.chunk_mb, "active": True}


@router.post("/simulate/reset")
def reset_simulations():
    """
    Reset ALL active simulations.
    Returns the system to normal operation.
    """
    _require_dev()
    return FailureSimulator.reset_all()
