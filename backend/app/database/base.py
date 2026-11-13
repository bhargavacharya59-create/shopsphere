"""
SQLAlchemy database engine and session configuration.
Supports both PostgreSQL (production) and SQLite (development/testing).
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def _build_engine():
    url = settings.DATABASE_URL
    is_sqlite = url.startswith("sqlite")

    if is_sqlite:
        eng = create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=False,
        )
        # Enable FK support for SQLite
        @event.listens_for(eng, "connect")
        def set_fk(conn, _):
            conn.execute("PRAGMA foreign_keys=ON")
        logger.info("Using SQLite database (development mode)")
    else:
        from sqlalchemy.pool import QueuePool
        eng = create_engine(
            url,
            poolclass=QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
        )
        logger.info("Using PostgreSQL database")
    return eng


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        db.rollback()
        logger.error(f"Database session error: {exc}", exc_info=True)
        raise
    finally:
        db.close()
