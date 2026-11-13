"""
Payment endpoints.
NOTE: This is a mock payment system. No real card processing occurs.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models.order import Payment
from app.schemas.order import PaymentResponse
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment details by ID (only accessible to the order's owner)."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")

    # Ensure user owns the associated order
    if payment.order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return payment
