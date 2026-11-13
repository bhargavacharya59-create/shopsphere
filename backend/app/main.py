"""
ShopSphere — FastAPI Backend
Part of the DevInsight AI monitoring demo.

Service: shopsphere
Docs: http://localhost:8000/docs
Health: http://localhost:8000/health
Metrics: http://localhost:8000/metrics
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy import text

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.database.base import engine, SessionLocal
from app.database import Base
from app.middleware.request_logging import RequestLoggingMiddleware
from app.monitoring.metrics import get_metrics_output, METRICS_CONTENT_TYPE
from app.monitoring.tracing import setup_tracing

# Import all models so SQLAlchemy registers them before create_all
from app.models import User, Product, Category, Cart, CartItem, Order, OrderItem, Payment

# Import routers
from app.api.routes.auth import router as auth_router
from app.api.routes.products import router as products_router
from app.api.routes.cart import router as cart_router
from app.api.routes.orders import router as orders_router
from app.api.routes.payments import router as payments_router
from app.api.routes.dev_simulate import router as dev_router

# Configure structured JSON logging
setup_logging()
logger = logging.getLogger("shopsphere.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info(
        f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}",
        extra={"extra_environment": settings.APP_ENV},
    )

    # Create all tables (use Alembic in production)
    Base.metadata.create_all(bind=engine)

    # Seed demo data in development
    if settings.is_development:
        try:
            from app.database.seed import seed_database
            db = SessionLocal()
            seed_database(db)
            db.close()
        except Exception as e:
            logger.warning(f"Seeding skipped: {e}")

    # Initialize OpenTelemetry tracing
    setup_tracing()

    if settings.ENABLE_FAILURE_SIMULATION:
        logger.warning(
            "⚠️  FAILURE SIMULATION IS ENABLED — do not use in production",
            extra={"extra_simulation_enabled": True},
        )

    logger.info("ShopSphere backend ready")
    yield

    logger.info("ShopSphere backend shutting down")


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="ShopSphere API",
    description=(
        "Full-stack e-commerce API for ShopSphere. "
        "Part of the DevInsight AI monitoring demonstration. "
        "Includes structured logging, Prometheus metrics, and OpenTelemetry tracing."
    ),
    version=settings.SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Trace-ID"],
)

# ─── Request Logging & Metrics Middleware ─────────────────────────────────────

app.add_middleware(RequestLoggingMiddleware)

# ─── Global Exception Handler ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {exc}",
        exc_info=True,
        extra={
            "extra_path": str(request.url.path),
            "extra_method": request.method,
            "extra_exception_type": type(exc).__name__,
        },
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again.",
            "request_id": request.headers.get("X-Request-ID", ""),
        },
    )

# ─── API Routes ───────────────────────────────────────────────────────────────

API_PREFIX = "/api"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(products_router, prefix=API_PREFIX)
app.include_router(cart_router, prefix=API_PREFIX)
app.include_router(orders_router, prefix=API_PREFIX)
app.include_router(payments_router, prefix=API_PREFIX)

# Dev failure simulation endpoints — only registered in non-production
if not settings.is_production:
    app.include_router(dev_router, prefix=API_PREFIX)
    logger.info("Dev simulation endpoints registered (non-production)")

# ─── System Endpoints ─────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health_check():
    """Basic liveness probe. Returns OK if the process is running."""
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "environment": settings.APP_ENV,
    }


@app.get("/ready", tags=["System"])
def readiness_check():
    """
    Readiness probe. Verifies database connectivity.
    Returns 503 if the database is unreachable.
    """
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {
            "status": "ready",
            "service": settings.SERVICE_NAME,
            "database": "connected",
        }
    except Exception as exc:
        logger.error(f"Readiness check failed: {exc}")
        from app.monitoring.metrics import db_connection_failures_total
        db_connection_failures_total.inc()
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(exc),
            },
        )


@app.get("/metrics", tags=["System"])
def prometheus_metrics():
    """Prometheus metrics endpoint for DevInsight AI scraping."""
    return Response(content=get_metrics_output(), media_type=METRICS_CONTENT_TYPE)
