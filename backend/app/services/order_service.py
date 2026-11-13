"""
Order service — create orders, process mock payments, retrieve order history.
"""
import uuid
import random
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus
from app.models.cart import Cart, CartItem
from app.schemas.order import OrderCreate
from app.services.cart_service import CartService
from app.core.logging_config import get_logger
from app.monitoring.metrics import orders_total, payments_total

logger = get_logger(__name__)


def _generate_order_number() -> str:
    """Generate a unique readable order number."""
    return f"ORD-{uuid.uuid4().hex[:8].upper()}"


class OrderService:
    @staticmethod
    def create_order(db: Session, user_id: int, order_data: OrderCreate) -> Order:
        """
        Create an order from the user's cart.
        Performs mock payment processing — no real card data is collected.
        """
        cart = CartService.get_or_create_cart(db, user_id)
        if not cart.items:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty. Add items before placing an order.",
            )

        # Calculate totals
        subtotal = sum(item.product.price * item.quantity for item in cart.items)
        shipping_cost = 0.0 if subtotal >= 50 else 9.99
        tax = round(subtotal * 0.08, 2)  # 8% tax
        total = round(subtotal + shipping_cost + tax, 2)

        shipping = order_data.shipping

        # Create the order record
        order = Order(
            order_number=_generate_order_number(),
            user_id=user_id,
            status=OrderStatus.PENDING.value,
            subtotal=round(subtotal, 2),
            shipping_cost=shipping_cost,
            tax=tax,
            total=total,
            shipping_name=shipping.name,
            shipping_email=shipping.email,
            shipping_phone=shipping.phone,
            shipping_address=shipping.address,
            shipping_city=shipping.city,
            shipping_state=shipping.state,
            shipping_zip=shipping.zip_code,
            shipping_country=shipping.country,
            notes=order_data.notes,
        )
        db.add(order)
        db.flush()  # Get order ID before adding items

        # Create order items (price locked at time of order)
        for cart_item in cart.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                unit_price=cart_item.product.price,
                subtotal=round(cart_item.product.price * cart_item.quantity, 2),
                product_name=cart_item.product.name,
                product_image=cart_item.product.image_url,
            )
            db.add(order_item)

            # Decrement stock
            cart_item.product.stock_quantity = max(
                0, cart_item.product.stock_quantity - cart_item.quantity
            )

        # Process mock payment
        payment = OrderService._process_mock_payment(
            db=db,
            order=order,
            payment_method=order_data.payment_method,
            card_last_four=order_data.card_last_four,
            amount=total,
        )
        db.add(payment)

        if payment.status == PaymentStatus.COMPLETED.value:
            order.status = OrderStatus.CONFIRMED.value
            orders_total.labels(status="confirmed").inc()
            logger.info(
                "Order created and payment confirmed",
                extra={
                    "extra_order_id": order.id,
                    "extra_order_number": order.order_number,
                    "extra_user_id": user_id,
                    "extra_total": total,
                },
            )
        else:
            order.status = OrderStatus.CANCELLED.value
            orders_total.labels(status="failed").inc()
            logger.warning(
                "Order created but payment failed",
                extra={
                    "extra_order_id": order.id,
                    "extra_failure_reason": payment.failure_reason,
                },
            )

        # Clear the cart after successful order
        CartService.clear_cart(db, user_id)

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def _process_mock_payment(
        db: Session,
        order: Order,
        payment_method: str,
        card_last_four: Optional[str],
        amount: float,
    ) -> Payment:
        """
        Mock payment processor.
        In a real application this would call Stripe/PayPal/etc.
        NEVER stores real card data.
        """
        # Check if failure simulation is active for payments
        from app.services.failure_simulator import FailureSimulator
        if FailureSimulator.should_fail("payment"):
            payment = Payment(
                order_id=order.id,
                payment_method=payment_method,
                status=PaymentStatus.FAILED.value,
                amount=amount,
                card_last_four=card_last_four,
                failure_reason="[SIMULATED] Payment service unavailable",
                processed_at=datetime.now(timezone.utc),
            )
            payments_total.labels(status="failed").inc()
            logger.error(
                "[SIMULATED FAILURE] Payment service failed",
                extra={"extra_order_id": order.id, "extra_scenario": "payment_failure"},
            )
            return payment

        # Simulate 95% success rate in normal operation
        success = random.random() < 0.95
        transaction_id = f"TXN-{uuid.uuid4().hex[:16].upper()}" if success else None

        payment = Payment(
            order_id=order.id,
            payment_method=payment_method,
            status=PaymentStatus.COMPLETED.value if success else PaymentStatus.FAILED.value,
            amount=amount,
            transaction_id=transaction_id,
            card_last_four=card_last_four,
            failure_reason=None if success else "Payment could not be processed. Please try again later.",
            processed_at=datetime.now(timezone.utc),
        )
        payments_total.labels(status="completed" if success else "failed").inc()
        return payment

    @staticmethod
    def get_user_orders(
        db: Session, user_id: int, page: int = 1, page_size: int = 10
    ) -> Tuple[List[Order], int]:
        query = (
            db.query(Order)
            .options(
                joinedload(Order.items),
                joinedload(Order.payment),
            )
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        total = query.count()
        orders = query.offset((page - 1) * page_size).limit(page_size).all()
        return orders, total

    @staticmethod
    def get_order_by_id(db: Session, order_id: int, user_id: int) -> Optional[Order]:
        return (
            db.query(Order)
            .options(
                joinedload(Order.items),
                joinedload(Order.payment),
            )
            .filter(Order.id == order_id, Order.user_id == user_id)
            .first()
        )
