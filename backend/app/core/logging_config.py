"""
Structured JSON logging configuration for ShopSphere.
Produces logs compatible with DevInsight AI telemetry analysis.

Log fields include: timestamp, level, service, environment,
request_id, trace_id, endpoint, status_code, error details.

SECURITY: passwords, tokens, and payment credentials are never logged.
"""
import logging
import json
import sys
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from contextvars import ContextVar
from app.core.config import settings

# Context variable to carry request-scoped IDs across async calls
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="")


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON for DevInsight AI ingestion."""

    SENSITIVE_KEYS = {"password", "token", "secret", "card_number", "cvv", "authorization"}

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": settings.SERVICE_NAME,
            "version": settings.SERVICE_VERSION,
            "environment": settings.APP_ENV,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(""),
            "trace_id": trace_id_var.get(""),
        }

        # Attach extra fields if present
        for key, value in record.__dict__.items():
            if key.startswith("extra_") and key[6:] not in self.SENSITIVE_KEYS:
                log_obj[key[6:]] = value

        # Exception details
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
            log_obj["exception_type"] = (
                record.exc_info[0].__name__ if record.exc_info[0] else None
            )

        return json.dumps(log_obj, default=str)


def setup_logging() -> None:
    """Configure root logger to use JSON structured format."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def generate_request_id() -> str:
    return str(uuid.uuid4())
