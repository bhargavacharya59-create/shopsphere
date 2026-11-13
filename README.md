# ShopSphere

A full-stack e-commerce application built as a **monitored target** for [DevInsight AI](https://gitlab.com/bhargavacharya59/shopsphere) — an AI-powered application failure detection and root cause analysis platform.

ShopSphere is a realistic shopping website that generates structured logs, Prometheus metrics, and OpenTelemetry traces. DevInsight AI connects to these telemetry streams to detect anomalies and investigate failures.

---

## Architecture

```
┌─────────────────┐        ┌─────────────────┐        ┌──────────────┐
│  React Frontend │──────▶│  FastAPI Backend │──────▶│  PostgreSQL  │
│  (Vite + TS)    │  HTTP  │  (Python 3.12)  │  SQL   │  Database    │
│  Port 5173      │        │  Port 8000       │        │  Port 5432   │
└─────────────────┘        └────────┬────────┘        └──────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             Structured        Prometheus      OpenTelemetry
             JSON Logs         /metrics         Traces
                    │               │               │
                    └───────────────┴───────────────┘
                                    │
                             DevInsight AI
                         (monitors ShopSphere)
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Python 3.12, FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose) + bcrypt |
| Metrics | Prometheus (prometheus-client) |
| Tracing | OpenTelemetry |
| Testing | pytest, Vitest |
| Containers | Docker, Docker Compose |

---

## Folder Structure

```
shopsphere/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings
│   │   │   ├── security.py      # JWT + bcrypt
│   │   │   └── logging_config.py # Structured JSON logging
│   │   ├── api/routes/          # Route handlers
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   ├── database/            # Engine, session, seeder
│   │   ├── middleware/          # Request logging middleware
│   │   └── monitoring/          # Prometheus metrics, OTel tracing
│   ├── tests/                   # pytest test suite
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router setup
│   │   ├── pages/               # 11 page components
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # Auth & Cart React contexts
│   │   ├── lib/api.ts           # Axios client
│   │   └── types/               # TypeScript types
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Python** 3.12+
- **Node.js** 18+
- **PostgreSQL** 14+ (or Docker)

---

## Local Setup (Without Docker)

### 1. Clone the repo

```bash
git clone https://gitlab.com/bhargavacharya59/shopsphere.git
cd shopsphere
```

### 2. Backend setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env — set your DATABASE_URL and SECRET_KEY

# Install dependencies
pip install -r requirements.txt

# Start the server (tables and seed data created automatically on first run)
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

### 3. Frontend setup

```bash
cd frontend

# Copy environment config
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `SECRET_KEY` | JWT signing secret (min 32 chars) | **Must change** |
| `APP_ENV` | `development` / `production` / `testing` | `development` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry | `1440` (24h) |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |
| `ENABLE_METRICS` | Expose /metrics endpoint | `true` |
| `OTLP_ENDPOINT` | OpenTelemetry collector URL | _(empty = disabled)_ |
| `ENABLE_FAILURE_SIMULATION` | Enable dev failure endpoints | `false` |
| `SERVICE_NAME` | Service identifier for telemetry | `shopsphere` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

---

## Docker Setup (with DevInsight AI)

For live monitoring, start the DevInsight stack first. It creates the shared `observability-net` network and listens on its normal ports.

In the DevInsight repository root, create the shared network once and start its Compose stack:

```bash
docker network create observability-net
docker compose up -d --build
```

Then in this ShopSphere repository root:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Set INGEST_API_KEY in this root .env to the exact same value as DevInsight.
docker compose up -d --build
```

ShopSphere uses non-conflicting host ports:

- Storefront: http://localhost:3002
- Backend API: http://localhost:8001
- API docs: http://localhost:8001/docs
- PostgreSQL: localhost:5433

DevInsight remains available at http://localhost:3000 and its API at http://localhost:8000.

ShopSphere sends HTTP 5xx events to DevInsight after responding to the customer, Prometheus scrapes ShopSphere at `shopsphere-backend:8000/metrics`, and OpenTelemetry traces are exported to `http://devinsight-otel:4317`. The same random `INGEST_API_KEY` must be configured in both repository-root `.env` files. Never commit real `.env` files.

To stop ShopSphere while keeping database data:

```bash
docker compose down
```

Use `docker compose down -v` only when you intentionally want to delete the ShopSphere database volume.

---

## Database Setup

Tables are created automatically on first startup.  
Seed data (27 products, 6 categories, demo users) is inserted in `development` mode.

**Demo accounts:**

| Email | Password | Role |
|-------|----------|------|
| `demo@shopsphere.com` | `demo1234` | Customer |
| `admin@shopsphere.com` | `admin1234` | Admin |

### Alembic migrations (for production)

```bash
cd backend

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## API Documentation

FastAPI auto-generates interactive docs:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, receive JWT |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/products` | List/search/filter products |
| `GET` | `/api/products/{id}` | Product detail |
| `GET` | `/api/products/categories` | All categories |
| `GET` | `/api/cart` | Get cart |
| `POST` | `/api/cart/items` | Add to cart |
| `PATCH` | `/api/cart/items/{id}` | Update quantity |
| `DELETE` | `/api/cart/items/{id}` | Remove from cart |
| `POST` | `/api/orders` | Place order |
| `GET` | `/api/orders` | Order history |
| `GET` | `/api/orders/{id}` | Order detail |
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness probe (checks DB) |
| `GET` | `/metrics` | Prometheus metrics |

---

## Testing

### Backend (pytest)

```bash
cd backend
python -m pytest tests/ -v
```

38 tests covering:
- Health endpoints
- Auth (register, login, JWT, duplicate detection)
- Products (list, filter, search, pagination, sort)
- Cart (add, update, remove, total calculation)
- Orders (create, list, access control)
- Failure simulation scenarios

Tests use SQLite in-memory — no PostgreSQL required.

### Frontend (Vitest)

```bash
cd frontend
npm test
```

---

## Failure Simulation (DevInsight AI Demo)

ShopSphere includes a **controlled failure simulator** so DevInsight AI can demonstrate real anomaly detection.

**Enable it:**

```bash
# In backend/.env
ENABLE_FAILURE_SIMULATION=true
APP_ENV=development
```

### Available Scenarios

| Endpoint | Scenario | What DevInsight AI detects |
|----------|----------|---------------------------|
| `POST /api/dev/simulate/db-latency` | Slow DB queries | High database query latency |
| `POST /api/dev/simulate/payment-failure` | All checkouts fail | Payment API errors |
| `POST /api/dev/simulate/order-service` | Orders return 503 | Service unavailable |
| `POST /api/dev/simulate/error-spike` | Random 500 errors | Increased server error rate |
| `POST /api/dev/simulate/cpu-spike` | CPU-intensive workload | Abnormally high CPU usage |
| `POST /api/dev/simulate/memory-spike` | Memory allocation spike | Increasing memory usage |
| `POST /api/dev/simulate/reset` | Clear all simulations | — |
| `GET /api/dev/simulate/status` | Current simulation state | — |

**Example — simulate Payment Service failure:**

```bash
# Activate
curl -X POST http://localhost:8000/api/dev/simulate/payment-failure

# Now try to checkout — it will fail with:
# "Payment could not be processed. Please try again later."

# Reset
curl -X POST http://localhost:8000/api/dev/simulate/reset
```

**Safety guarantees:**
- Blocked entirely in `APP_ENV=production`
- Requires `ENABLE_FAILURE_SIMULATION=true`
- All simulations are bounded (CPU spike has a duration limit, memory spike has a 200MB cap)
- Every simulated failure is logged with `[SIMULATED FAILURE]` prefix
- No database data is damaged

---

## Monitoring Integration (DevInsight AI)

ShopSphere exposes three telemetry streams:

### 1. Structured Logs (JSON)

Every request emits a JSON log line:

```json
{
  "timestamp": "2026-11-07T08:00:00Z",
  "level": "INFO",
  "service": "shopsphere",
  "environment": "development",
  "request_id": "abc-123",
  "trace_id": "xyz-456",
  "endpoint": "/api/products",
  "status_code": 200,
  "duration_ms": 45.3
}
```

### 2. Prometheus Metrics

```
GET http://localhost:8000/metrics
```

Key metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `shopsphere_http_requests_total` | Counter | Total requests by endpoint/status |
| `shopsphere_http_request_duration_seconds` | Histogram | Request latency |
| `shopsphere_http_errors_total` | Counter | HTTP 4xx/5xx errors |
| `shopsphere_db_query_duration_seconds` | Histogram | DB operation latency |
| `shopsphere_db_connection_failures_total` | Counter | DB connection errors |
| `shopsphere_orders_total` | Counter | Orders by status |
| `shopsphere_payments_total` | Counter | Payment attempts by status |
| `shopsphere_simulated_failures_total` | Counter | Simulated failure events |

### 3. OpenTelemetry Traces

Configure the OTLP endpoint:

```env
OTLP_ENDPOINT=http://your-otel-collector:4317
```

Traces capture HTTP requests, backend processing, and database operations with correlation IDs.

---

## Pages

| Route | Page |
|-------|------|
| `/` | Home — hero banner, featured & trending products |
| `/products` | Product listing with filters, search, sort, pagination |
| `/products/:id` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | 3-step checkout (shipping → payment → review) |
| `/orders/:id/confirmation` | Order confirmation |
| `/orders` | Order history |
| `/orders/:id` | Order detail |
| `/login` | Sign in |
| `/register` | Create account |
| `/profile` | User profile |
