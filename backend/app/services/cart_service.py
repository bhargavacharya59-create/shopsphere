"""
Cart service — add, update, remove items, get cart.
"""
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate
from app.core.logging_config import get_logger
from app.monitoring.metrics import cart_operations_total

logger = get_logger(__name__)


class CartService:
    @staticmethod
    def get_or_create_cart(db: Session, user_id: int) -> Cart:
        """Return existing cart or create a new one for the user."""
        cart = (
            db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.category))
            .filter(Cart.user_id == user_id)
            .first()
        )
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    @staticmethod
    def add_item(db: Session, user_id: int, item_data: CartItemCreate) -> Cart:
        """Add a product to the cart, or increment quantity if already there."""
        cart = CartService.get_or_create_cart(db, user_id)

        # Validate product exists and is in stock
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.is_active == True,
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Only {product.stock_quantity} available.",
            )

        # Check if item already in cart
        existing_item = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id,
        ).first()

        if existing_item:
            new_qty = existing_item.quantity + item_data.quantity
            if new_qty > product.stock_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot add more than {product.stock_quantity} units.",
                )
            existing_item.quantity = new_qty
        else:
            new_item = CartItem(
                cart_id=cart.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
            )
            db.add(new_item)

        db.commit()
        cart_operations_total.labels(operation="add").inc()
        logger.info(f"Item added to cart", extra={
            "extra_user_id": user_id,
            "extra_product_id": item_data.product_id,
        })
        return CartService.get_or_create_cart(db, user_id)

    @staticmethod
    def update_item(db: Session, user_id: int, item_id: int, item_data: CartItemUpdate) -> Cart:
        cart = CartService.get_or_create_cart(db, user_id)
        item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        ).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found.")

        if item.product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock.",
            )

        item.quantity = item_data.quantity
        db.commit()
        cart_operations_total.labels(operation="update").inc()
        return CartService.get_or_create_cart(db, user_id)

    @staticmethod
    def remove_item(db: Session, user_id: int, item_id: int) -> Cart:
        cart = CartService.get_or_create_cart(db, user_id)
        item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        ).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found.")

        db.delete(item)
        db.commit()
        cart_operations_total.labels(operation="remove").inc()
        return CartService.get_or_create_cart(db, user_id)

    @staticmethod
    def clear_cart(db: Session, user_id: int) -> None:
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        if cart:
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            db.commit()
