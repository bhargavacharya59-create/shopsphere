from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional
from app.models.order import OrderStatus, PaymentStatus


class ShippingDetails(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    address: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1, max_length=100)
    state: Optional[str] = None
    zip_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(default="US", max_length=100)


class OrderCreate(BaseModel):
    shipping: ShippingDetails
    payment_method: str = Field(default="mock_card")
    # Mock card info — last 4 digits only, no real card processing
    card_last_four: Optional[str] = Field(None, min_length=4, max_length=4)
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str]
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: int
    payment_method: str
    status: PaymentStatus
    amount: float
    transaction_id: Optional[str]
    card_last_four: Optional[str]
    failure_reason: Optional[str]
    processed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    shipping_name: str
    shipping_email: str
    shipping_phone: Optional[str]
    shipping_address: str
    shipping_city: str
    shipping_state: Optional[str]
    shipping_zip: str
    shipping_country: str
    notes: Optional[str]
    items: List[OrderItemResponse]
    payment: Optional[PaymentResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
