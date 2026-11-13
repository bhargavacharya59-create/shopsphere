from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    stock_quantity: int = Field(default=0, ge=0)
    brand: Optional[str] = None
    category_id: int


class ProductResponse(ProductBase):
    id: int
    slug: str
    is_active: bool
    is_featured: bool
    is_trending: bool
    rating: float
    review_count: int
    in_stock: bool
    discount_percentage: int
    category: CategoryResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
