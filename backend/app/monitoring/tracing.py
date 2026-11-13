"""
OpenTelemetry tracing setup for ShopSphere.
Configurable via environment variables for DevInsight AI integration.
"""
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def setup_tracing() -> None:
    """
    Initialize OpenTelemetry tracing.
    Reads OTLP_ENDPOINT from environment — no-ops gracefully if unavailable.
    """
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

        resource = Resource.create({
            SERVICE_NAME: settings.SERVICE_NAME,
            SERVICE_VERSION: settings.SERVICE_VERSION,
            "deployment.environment": settings.APP_ENV,
        })

        provider = TracerProvider(resource=resource)

        # Only export if OTLP endpoint is configured
        if settings.OTLP_ENDPOINT:
            try:
                from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
                exporter = OTLPSpanExporter(endpoint=settings.OTLP_ENDPOINT, insecure=True)
                provider.add_span_processor(BatchSpanProcessor(exporter))
                logger.info(f"OpenTelemetry exporter configured: {settings.OTLP_ENDPOINT}")
            except Exception as e:
                logger.warning(f"OTLP exporter setup failed (continuing without export): {e}")

        trace.set_tracer_provider(provider)
        logger.info("OpenTelemetry tracing initialized")

    except ImportError:
        logger.warning("OpenTelemetry packages not available — tracing disabled")
    except Exception as e:
        logger.warning(f"Tracing setup failed (continuing): {e}")


def get_tracer(name: str):
    """Get a named tracer for manual instrumentation."""
    try:
        from opentelemetry import trace
        return trace.get_tracer(name)
    except Exception:
        return None
