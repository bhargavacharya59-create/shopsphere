import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default=OrderStatus.PENDING.value, nullable=False)
    subtotal = Column(Float, nullable=False)
    shipping_cost = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    total = Column(Float, nullable=False)

    # Shipping details
    shipping_name = Column(String(255), nullable=False)
    shipping_email = Column(String(255), nullable=False)
    shipping_phone = Column(String(50), nullable=True)
    shipping_address = Column(Text, nullable=False)
    shipping_city = Column(String(100), nullable=False)
    shipping_state = Column(String(100), nullable=True)
    shipping_zip = Column(String(20), nullable=False)
    shipping_country = Column(String(100), nullable=False, default="US")

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order id={self.id} number={self.order_number} status={self.status}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price locked at time of order
    subtotal = Column(Float, nullable=False)
    product_name = Column(String(255), nullable=False)  # Denormalized for historical record
    product_image = Column(String(500), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    def __repr__(self):
        return f"<OrderItem id={self.id} order_id={self.order_id} product={self.product_name}>"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False, index=True)
    payment_method = Column(String(50), nullable=False, default="mock_card")  # Mock payment only
    status = Column(String(20), default=PaymentStatus.PENDING.value, nullable=False)
    amount = Column(Float, nullable=False)
    transaction_id = Column(String(100), nullable=True)  # Simulated transaction ID
    # NOTE: Real card details are never stored. This is a mock payment system.
    card_last_four = Column(String(4), nullable=True)  # Last 4 digits only, never full number
    failure_reason = Column(String(255), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="payment")

    def __repr__(self):
        return f"<Payment id={self.id} order_id={self.order_id} status={self.status}>"
