"""
Authentication service — registration, login, user retrieval.
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password, decode_access_token
from app.core.logging_config import get_logger
from app.database.base import get_db
from app.monitoring.metrics import user_registrations_total

logger = get_logger(__name__)
bearer_scheme = HTTPBearer()


class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user. Raises HTTP 409 if email already exists."""
        existing = AuthService.get_user_by_email(db, user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hash_password(user_data.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        user_registrations_total.inc()
        logger.info(
            "New user registered",
            extra={"extra_user_id": user.id, "extra_email": user.email},
        )
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """Verify credentials. Raises HTTP 401 on failure."""
        user = AuthService.get_user_by_email(db, email)
        # Use constant-time comparison to avoid timing attacks
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled.",
            )
        logger.info(
            "User authenticated",
            extra={"extra_user_id": user.id},
        )
        return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency — extracts and validates the JWT bearer token."""
    token = credentials.credentials
    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = AuthService.get_user_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )
    return user
