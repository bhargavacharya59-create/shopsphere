import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.schemas.product import ProductResponse, ProductListResponse, CategoryResponse
from app.services.product_service import ProductService
from app.services.failure_simulator import FailureSimulator

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    category_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=200),
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    sort_by: str = Query(default="created_at", pattern="^(price|rating|created_at|name)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    featured: bool = Query(default=False),
    trending: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    """List products with filtering, sorting, and pagination."""
    # Simulate DB latency if scenario is active
    await FailureSimulator.apply_latency("db_latency")

    products, total = ProductService.get_products(
        db=db,
        page=page,
        page_size=page_size,
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order,
        featured_only=featured,
        trending_only=trending,
    )

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """List all product categories."""
    return ProductService.get_categories(db)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    await FailureSimulator.apply_latency("db_latency")

    product = ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product
