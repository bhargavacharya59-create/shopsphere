"""
Prometheus metrics for ShopSphere.
Exposes HTTP, database, and business metrics for DevInsight AI monitoring.
"""
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
    REGISTRY,
)

# ─── HTTP Metrics ────────────────────────────────────────────────────────────

http_requests_total = Counter(
    "shopsphere_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)

http_request_duration_seconds = Histogram(
    "shopsphere_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

http_requests_active = Gauge(
    "shopsphere_http_requests_active",
    "Currently active HTTP requests",
)

http_errors_total = Counter(
    "shopsphere_http_errors_total",
    "Total HTTP errors (4xx and 5xx)",
    ["method", "endpoint", "status_code"],
)

# ─── Database Metrics ────────────────────────────────────────────────────────

db_query_duration_seconds = Histogram(
    "shopsphere_db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation", "table"],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
)

db_connection_failures_total = Counter(
    "shopsphere_db_connection_failures_total",
    "Total database connection failures",
)

# ─── Business Metrics ────────────────────────────────────────────────────────

orders_total = Counter(
    "shopsphere_orders_total",
    "Total orders placed",
    ["status"],
)

payments_total = Counter(
    "shopsphere_payments_total",
    "Total payment attempts",
    ["status"],
)

cart_operations_total = Counter(
    "shopsphere_cart_operations_total",
    "Total cart operations",
    ["operation"],
)

user_registrations_total = Counter(
    "shopsphere_user_registrations_total",
    "Total user registrations",
)

# ─── Failure Simulation Metrics ──────────────────────────────────────────────

simulated_failures_total = Counter(
    "shopsphere_simulated_failures_total",
    "Total simulated failures (dev only)",
    ["scenario"],
)


def get_metrics_output() -> bytes:
    """Return Prometheus metrics in text format."""
    return generate_latest(REGISTRY)


METRICS_CONTENT_TYPE = CONTENT_TYPE_LATEST
