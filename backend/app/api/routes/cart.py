from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate
from app.services.cart_service import CartService
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the authenticated user's cart."""
    return CartService.get_or_create_cart(db, current_user.id)


@router.post("/items", response_model=CartResponse, status_code=201)
def add_to_cart(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a product to the cart."""
    return CartService.add_item(db, current_user.id, item)


@router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    item: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the quantity of a cart item."""
    return CartService.update_item(db, current_user.id, item_id, item)


@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a product from the cart."""
    return CartService.remove_item(db, current_user.id, item_id)
