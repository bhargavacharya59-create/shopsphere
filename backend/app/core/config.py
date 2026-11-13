"""
Application configuration using Pydantic Settings.
All secrets loaded from environment variables — never hardcoded.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_ENV: str = "development"
    DEBUG: bool = True
    SERVICE_NAME: str = "shopsphere"
    SERVICE_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "postgresql://shopsphere_user:shopsphere_pass@localhost:5432/shopsphere_db"

    # Security
    SECRET_KEY: str = "change-me-in-production-must-be-at-least-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Monitoring
    ENABLE_METRICS: bool = True
    OTLP_ENDPOINT: str = "http://localhost:4317"
    DEVINSIGHT_INGEST_URL: str = ""
    DEVINSIGHT_INGEST_API_KEY: str = ""

    # Failure Simulation — disabled by default, dev-only
    ENABLE_FAILURE_SIMULATION: bool = False

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_testing(self) -> bool:
        return self.APP_ENV == "testing"

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
