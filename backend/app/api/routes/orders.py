import math
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services.order_service import OrderService
from app.services.auth_service import get_current_user
from app.services.failure_simulator import FailureSimulator
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Place an order from the user's current cart.
    Processes mock payment and clears the cart on success.
    """
    # Check if order service failure is simulated
    if FailureSimulator.should_fail("order_service"):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="[SIMULATED] Order service is currently unavailable. Please try again later.",
        )

    return OrderService.create_order(db, current_user.id, order_data)


@router.get("", response_model=OrderListResponse)
def list_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the authenticated user's orders, newest first."""
    orders, total = OrderService.get_user_orders(db, current_user.id, page, page_size)
    return OrderListResponse(items=[OrderResponse.model_validate(o) for o in orders], total=total)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific order by ID. Only the order's owner can access it."""
    order = OrderService.get_order_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order
