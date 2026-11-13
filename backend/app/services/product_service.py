"""
Product and category service.
"""
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, asc, desc

from app.models.product import Product, Category
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ProductService:
    @staticmethod
    def get_products(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        featured_only: bool = False,
        trending_only: bool = False,
    ) -> Tuple[List[Product], int]:
        query = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.is_active == True)
        )

        if category_id:
            query = query.filter(Product.category_id == category_id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.brand.ilike(search_term),
                )
            )

        if min_price is not None:
            query = query.filter(Product.price >= min_price)

        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        if featured_only:
            query = query.filter(Product.is_featured == True)

        if trending_only:
            query = query.filter(Product.is_trending == True)

        total = query.count()

        # Sorting
        sort_col = getattr(Product, sort_by, Product.created_at)
        sort_fn = desc if sort_order == "desc" else asc
        query = query.order_by(sort_fn(sort_col))

        # Pagination
        offset = (page - 1) * page_size
        products = query.offset(offset).limit(page_size).all()

        return products, total

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
        return (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )

    @staticmethod
    def get_product_by_slug(db: Session, slug: str) -> Optional[Product]:
        return (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.slug == slug, Product.is_active == True)
            .first()
        )

    @staticmethod
    def get_categories(db: Session) -> List[Category]:
        return db.query(Category).order_by(Category.name).all()

    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()
