from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from app.schemas.product import ProductResponse


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=99)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    subtotal: float
    product: ProductResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse]
    total: float
    item_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
