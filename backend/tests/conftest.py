"""
Test configuration.

Uses SQLite (file-based per-session) so we don't need PostgreSQL.
The lifespan seeder is suppressed by patching settings.is_development = False
before the app starts.
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_ss.db"
os.environ.setdefault("SECRET_KEY", "test-secret-key-at-least-32-chars-long-ok")
os.environ["APP_ENV"] = "testing"        # is_development → False ← skips seeder
os.environ["ENABLE_FAILURE_SIMULATION"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

_ENGINE = create_engine(
    "sqlite:///./test_ss.db",
    connect_args={"check_same_thread": False},
)

# Enable FK support in SQLite
@event.listens_for(_ENGINE, "connect")
def set_sqlite_pragma(conn, _):
    conn.execute("PRAGMA foreign_keys=ON")

_Session = sessionmaker(autocommit=False, autoflush=False, bind=_ENGINE)

# ── Patch before any app module is imported ───────────────────────────────────
from app.database import base as _db_base
_db_base.engine = _ENGINE
_db_base.SessionLocal = _Session

from app.database.base import Base, get_db

import app.main as _main
_main.engine = _ENGINE
_main.SessionLocal = _Session

from app.main import app

# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=_ENGINE)
    yield
    Base.metadata.drop_all(bind=_ENGINE)
    import os as _os
    try:
        _os.remove("./test_ss.db")
    except Exception:
        pass


@pytest.fixture(autouse=True)
def wipe_data():
    """Delete all rows between tests (keeps schema)."""
    yield
    s = _Session()
    try:
        # Delete in dependency order
        from app.models.order import Payment, OrderItem, Order
        from app.models.cart import CartItem, Cart
        from app.models.product import Product, Category
        from app.models.user import User
        for m in [Payment, OrderItem, Order, CartItem, Cart, Product, Category, User]:
            s.query(m).delete(synchronize_session=False)
        s.commit()
    except Exception:
        s.rollback()
    finally:
        s.close()


@pytest.fixture
def db():
    s = _Session()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seed_categories(db):
    from app.models.product import Category
    cats = [
        Category(name="Electronics", slug="electronics"),
        Category(name="Books", slug="books"),
    ]
    db.add_all(cats)
    db.commit()
    for c in cats:
        db.refresh(c)
    return cats


@pytest.fixture
def seed_products(db, seed_categories):
    from app.models.product import Product
    prods = [
        Product(name="Test Phone", slug="test-phone", price=999.99, stock_quantity=10,
                category_id=seed_categories[0].id, is_active=True, rating=4.5, review_count=100),
        Product(name="Test Book", slug="test-book", price=19.99, stock_quantity=50,
                category_id=seed_categories[1].id, is_active=True, is_featured=True,
                rating=4.8, review_count=500),
    ]
    db.add_all(prods)
    db.commit()
    for p in prods:
        db.refresh(p)
    return prods


@pytest.fixture
def registered_user(client):
    r = client.post("/api/auth/register", json={
        "email": "testuser@example.com",
        "full_name": "Test User",
        "password": "testpass123",
    })
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['access_token']}"}
