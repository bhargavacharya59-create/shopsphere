"""
Request logging middleware.
Assigns a unique request_id and trace_id to every request.
Logs structured request/response details for DevInsight AI.
"""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging_config import request_id_var, trace_id_var
from app.monitoring.metrics import (
    http_requests_total,
    http_request_duration_seconds,
    http_requests_active,
    http_errors_total,
)

logger = logging.getLogger("shopsphere.requests")

# Paths excluded from detailed logging (high-frequency health checks)
SKIP_LOG_PATHS = {"/health", "/ready", "/metrics"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Assign correlation IDs
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))

        # Store in context vars so they're available throughout the request
        request_id_token = request_id_var.set(request_id)
        trace_id_token = trace_id_var.set(trace_id)

        start_time = time.perf_counter()
        http_requests_active.inc()

        try:
            response = await call_next(request)
        except Exception as exc:
            duration = time.perf_counter() - start_time
            http_requests_active.dec()
            http_requests_total.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=500,
            ).inc()
            http_errors_total.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=500,
            ).inc()
            logger.error(
                "Unhandled exception during request",
                exc_info=True,
                extra={
                    "extra_request_id": request_id,
                    "extra_trace_id": trace_id,
                    "extra_method": request.method,
                    "extra_path": request.url.path,
                    "extra_duration_ms": round(duration * 1000, 2),
                },
            )
            raise
        finally:
            request_id_var.reset(request_id_token)
            trace_id_var.reset(trace_id_token)

        duration = time.perf_counter() - start_time
        http_requests_active.dec()

        # Record Prometheus metrics
        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
        ).inc()
        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=request.url.path,
        ).observe(duration)

        if response.status_code >= 400:
            http_errors_total.labels(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code,
            ).inc()

        # Structured request log (skips noisy health-check paths)
        if request.url.path not in SKIP_LOG_PATHS:
            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(
                log_level,
                f"{request.method} {request.url.path} {response.status_code}",
                extra={
                    "extra_request_id": request_id,
                    "extra_trace_id": trace_id,
                    "extra_method": request.method,
                    "extra_endpoint": request.url.path,
                    "extra_status_code": response.status_code,
                    "extra_duration_ms": round(duration * 1000, 2),
                    "extra_client_ip": request.client.host if request.client else None,
                },
            )

        # Propagate correlation IDs in response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Trace-ID"] = trace_id
        return response
