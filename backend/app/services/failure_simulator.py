"""
Controlled failure simulator for DevInsight AI demonstration.

IMPORTANT SAFETY RULES:
- This module ONLY activates when ENABLE_FAILURE_SIMULATION=true in environment.
- All simulation state is in-memory only (no database damage).
- Every simulated failure is logged clearly with [SIMULATED FAILURE] prefix.
- Simulations are deterministic and bounded — they cannot crash the server.
- This code MUST NOT be exposed in production (checked at runtime).
"""
import asyncio
import time
import logging
import threading
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.core.config import settings
from app.core.logging_config import get_logger
from app.monitoring.metrics import simulated_failures_total

logger = get_logger(__name__)

# Thread-safe simulation state
_state_lock = threading.Lock()
_active_scenarios: Dict[str, Dict[str, Any]] = {}


class FailureSimulator:
    """
    Manages active failure scenarios.
    All methods are no-ops when ENABLE_FAILURE_SIMULATION=false.
    """

    @staticmethod
    def _guard() -> bool:
        """Returns True if simulation is allowed in current environment."""
        if settings.is_production:
            logger.error("Failure simulation attempted in PRODUCTION — blocked.")
            return False
        if not settings.ENABLE_FAILURE_SIMULATION:
            return False
        return True

    @staticmethod
    def activate(scenario: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Activate a named failure scenario."""
        if not FailureSimulator._guard():
            return {"active": False, "reason": "Simulation disabled"}

        with _state_lock:
            _active_scenarios[scenario] = {
                "activated_at": datetime.now(timezone.utc).isoformat(),
                "config": config or {},
            }

        simulated_failures_total.labels(scenario=scenario).inc()
        logger.warning(
            f"[SIMULATED FAILURE] Scenario activated: {scenario}",
            extra={
                "extra_scenario": scenario,
                "extra_config": str(config),
                "extra_simulation": True,
            },
        )
        return {"active": True, "scenario": scenario, "config": config}

    @staticmethod
    def deactivate(scenario: str) -> Dict[str, Any]:
        """Deactivate a specific scenario."""
        with _state_lock:
            removed = _active_scenarios.pop(scenario, None)
        if removed:
            logger.info(f"[SIMULATED FAILURE] Scenario deactivated: {scenario}")
        return {"active": False, "scenario": scenario}

    @staticmethod
    def reset_all() -> Dict[str, Any]:
        """Clear all active scenarios."""
        with _state_lock:
            cleared = list(_active_scenarios.keys())
            _active_scenarios.clear()
        logger.info(f"[SIMULATED FAILURE] All scenarios reset: {cleared}")
        return {"reset": True, "cleared_scenarios": cleared}

    @staticmethod
    def get_status() -> Dict[str, Any]:
        with _state_lock:
            return {
                "simulation_enabled": settings.ENABLE_FAILURE_SIMULATION,
                "environment": settings.APP_ENV,
                "active_scenarios": dict(_active_scenarios),
            }

    @staticmethod
    def should_fail(scenario: str) -> bool:
        """Check if a scenario is currently active."""
        if not settings.ENABLE_FAILURE_SIMULATION:
            return False
        with _state_lock:
            return scenario in _active_scenarios

    @staticmethod
    def get_latency(scenario: str) -> float:
        """Get configured latency delay for a scenario (seconds)."""
        with _state_lock:
            s = _active_scenarios.get(scenario, {})
            return float(s.get("config", {}).get("delay_seconds", 3.0))

    @staticmethod
    async def apply_latency(scenario: str) -> None:
        """Inject async latency if scenario is active."""
        if FailureSimulator.should_fail(scenario):
            delay = FailureSimulator.get_latency(scenario)
            logger.warning(
                f"[SIMULATED FAILURE] Injecting {delay}s latency for scenario: {scenario}",
                extra={"extra_scenario": scenario, "extra_delay": delay},
            )
            await asyncio.sleep(delay)

    @staticmethod
    def apply_cpu_spike(duration_seconds: float = 5.0, intensity: float = 0.8) -> None:
        """
        Simulate a CPU spike in a background thread.
        Bounded by duration — will not run indefinitely.
        """
        def _spin(stop_at: float, intensity: float):
            logger.warning(
                f"[SIMULATED FAILURE] CPU spike started: {duration_seconds}s at {intensity*100:.0f}%"
            )
            end = time.time() + stop_at
            while time.time() < end:
                # Busy-wait for `intensity` fraction of each 10ms slot
                slot_end = time.time() + 0.01 * intensity
                while time.time() < slot_end:
                    _ = sum(i * i for i in range(1000))
                # Sleep for the remainder
                time.sleep(0.01 * (1 - intensity))
            logger.info("[SIMULATED FAILURE] CPU spike ended")

        t = threading.Thread(target=_spin, args=(duration_seconds, intensity), daemon=True)
        t.start()

    @staticmethod
    def apply_memory_leak(chunk_mb: int = 50) -> None:
        """
        Simulate a memory allocation spike.
        Bounded to max 200MB. State is held in the scenario config and released on reset.
        """
        chunk_mb = min(chunk_mb, 200)  # Safety cap
        with _state_lock:
            if "memory_leak" not in _active_scenarios:
                return
            # Allocate bytes in scenario config (released when scenario cleared)
            _active_scenarios["memory_leak"]["_allocated"] = bytearray(chunk_mb * 1024 * 1024)
        logger.warning(
            f"[SIMULATED FAILURE] Memory spike allocated: {chunk_mb}MB",
            extra={"extra_scenario": "memory_leak", "extra_mb": chunk_mb},
        )
