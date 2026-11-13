"""
Database seeder — populates ShopSphere with realistic demo data.
Run: python -m app.database.seed
"""
import logging
from sqlalchemy.orm import Session
from app.database.base import SessionLocal, engine
from app.models import *  # ensures all models are registered
from app.database.base import Base
from app.core.security import hash_password

logger = logging.getLogger(__name__)

CATEGORIES = [
    {"name": "Electronics", "slug": "electronics", "description": "Gadgets, phones, computers", "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"},
    {"name": "Clothing", "slug": "clothing", "description": "Fashion for men and women", "image_url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"},
    {"name": "Home & Garden", "slug": "home-garden", "description": "Everything for your home", "image_url": "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400"},
    {"name": "Sports", "slug": "sports", "description": "Sports and outdoor equipment", "image_url": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400"},
    {"name": "Books", "slug": "books", "description": "Books, ebooks, and magazines", "image_url": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400"},
    {"name": "Beauty", "slug": "beauty", "description": "Skincare, makeup, and more", "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400"},
]

PRODUCTS = [
    # Electronics
    {"name": "iPhone 15 Pro", "slug": "iphone-15-pro", "description": "The most advanced iPhone ever. Titanium design, A17 Pro chip, and a pro camera system that redefines what a smartphone can do.", "price": 999.99, "original_price": 1099.99, "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600", "stock_quantity": 50, "brand": "Apple", "category_slug": "electronics", "is_featured": True, "is_trending": True, "rating": 4.8, "review_count": 2341},
    {"name": "Samsung Galaxy S24 Ultra", "slug": "samsung-galaxy-s24-ultra", "description": "The ultimate AI smartphone. Built-in S Pen, 200MP camera, and Galaxy AI features.", "price": 1199.99, "original_price": 1299.99, "image_url": "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600", "stock_quantity": 35, "brand": "Samsung", "category_slug": "electronics", "is_featured": True, "is_trending": False, "rating": 4.7, "review_count": 1876},
    {"name": "MacBook Pro 14-inch", "slug": "macbook-pro-14", "description": "Supercharged by M3 Pro chip. Up to 22-hour battery life. The world's best pro laptop.", "price": 1999.99, "original_price": 2199.99, "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", "stock_quantity": 20, "brand": "Apple", "category_slug": "electronics", "is_featured": True, "is_trending": True, "rating": 4.9, "review_count": 987},
    {"name": "Sony WH-1000XM5", "slug": "sony-wh-1000xm5", "description": "Industry-leading noise cancellation headphones with 30-hour battery life and exceptional sound quality.", "price": 349.99, "original_price": 399.99, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", "stock_quantity": 75, "brand": "Sony", "category_slug": "electronics", "is_featured": False, "is_trending": True, "rating": 4.7, "review_count": 3210},
    {"name": "iPad Pro 12.9-inch", "slug": "ipad-pro-12-9", "description": "The ultimate iPad experience with M2 chip, Liquid Retina XDR display, and Apple Pencil support.", "price": 1099.99, "original_price": 1199.99, "image_url": "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600", "stock_quantity": 40, "brand": "Apple", "category_slug": "electronics", "is_featured": True, "is_trending": False, "rating": 4.8, "review_count": 654},
    {"name": "Dell XPS 15 Laptop", "slug": "dell-xps-15", "description": "Premium Windows laptop with Intel Core i9, 32GB RAM, OLED display, and stunning build quality.", "price": 1799.99, "original_price": 2099.99, "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600", "stock_quantity": 15, "brand": "Dell", "category_slug": "electronics", "is_featured": False, "is_trending": False, "rating": 4.5, "review_count": 432},
    {"name": "AirPods Pro 2nd Gen", "slug": "airpods-pro-2", "description": "Up to 2x more Active Noise Cancellation. Adaptive Transparency. Personalized Spatial Audio.", "price": 249.99, "original_price": 279.99, "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600", "stock_quantity": 100, "brand": "Apple", "category_slug": "electronics", "is_featured": False, "is_trending": True, "rating": 4.6, "review_count": 5678},
    {"name": "LG OLED C3 65-inch TV", "slug": "lg-oled-c3-65", "description": "Perfect blacks, infinite contrast, and over a billion colors. The best TV for home theater.", "price": 1799.99, "original_price": 2499.99, "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600", "stock_quantity": 10, "brand": "LG", "category_slug": "electronics", "is_featured": True, "is_trending": False, "rating": 4.8, "review_count": 789},

    # Clothing
    {"name": "Classic Fit Oxford Shirt", "slug": "classic-oxford-shirt", "description": "A timeless button-down shirt crafted from 100% premium cotton. Perfect for the office or casual Fridays.", "price": 59.99, "original_price": 79.99, "image_url": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600", "stock_quantity": 200, "brand": "Timeless", "category_slug": "clothing", "is_featured": False, "is_trending": False, "rating": 4.4, "review_count": 234},
    {"name": "Premium Slim Jeans", "slug": "premium-slim-jeans", "description": "Stretch denim that moves with you. Modern slim fit with just the right amount of give.", "price": 89.99, "original_price": 119.99, "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", "stock_quantity": 150, "brand": "Denim Co", "category_slug": "clothing", "is_featured": False, "is_trending": True, "rating": 4.3, "review_count": 567},
    {"name": "Merino Wool Sweater", "slug": "merino-wool-sweater", "description": "Ultra-fine merino wool for exceptional softness and warmth without the bulk.", "price": 129.99, "original_price": 159.99, "image_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600", "stock_quantity": 80, "brand": "WoolCraft", "category_slug": "clothing", "is_featured": True, "is_trending": False, "rating": 4.6, "review_count": 189},
    {"name": "Athletic Running Shoes", "slug": "athletic-running-shoes", "description": "Lightweight and responsive. Engineered mesh upper for breathability, cushioned midsole for comfort.", "price": 129.99, "original_price": 159.99, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", "stock_quantity": 120, "brand": "SpeedStep", "category_slug": "clothing", "is_featured": True, "is_trending": True, "rating": 4.5, "review_count": 892},
    {"name": "Floral Summer Dress", "slug": "floral-summer-dress", "description": "Light and breezy floral print dress perfect for warm days. 100% organic cotton.", "price": 69.99, "original_price": None, "image_url": "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600", "stock_quantity": 60, "brand": "BloomWear", "category_slug": "clothing", "is_featured": False, "is_trending": True, "rating": 4.4, "review_count": 312},

    # Home & Garden
    {"name": "Aromatherapy Diffuser Set", "slug": "aromatherapy-diffuser-set", "description": "Ultrasonic diffuser with 12 essential oils. Creates a calming atmosphere in any room.", "price": 49.99, "original_price": 69.99, "image_url": "https://images.unsplash.com/photo-1545239351-ef35f43d514b?w=600", "stock_quantity": 90, "brand": "ZenHome", "category_slug": "home-garden", "is_featured": False, "is_trending": True, "rating": 4.5, "review_count": 678},
    {"name": "Cast Iron Skillet Set", "slug": "cast-iron-skillet-set", "description": "Pre-seasoned 3-piece cast iron skillet set. Even heat distribution for perfect cooking every time.", "price": 89.99, "original_price": 119.99, "image_url": "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600", "stock_quantity": 45, "brand": "IronChef", "category_slug": "home-garden", "is_featured": True, "is_trending": False, "rating": 4.7, "review_count": 1234},
    {"name": "Smart LED Desk Lamp", "slug": "smart-led-desk-lamp", "description": "Adjustable color temperature and brightness. USB-C charging port built in. App controlled.", "price": 79.99, "original_price": 99.99, "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600", "stock_quantity": 65, "brand": "BrightTech", "category_slug": "home-garden", "is_featured": False, "is_trending": True, "rating": 4.4, "review_count": 445},
    {"name": "Memory Foam Pillow", "slug": "memory-foam-pillow", "description": "Ergonomic memory foam pillow with cooling gel layer. Supports neck and spine alignment.", "price": 59.99, "original_price": 79.99, "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600", "stock_quantity": 130, "brand": "DreamSleep", "category_slug": "home-garden", "is_featured": False, "is_trending": False, "rating": 4.3, "review_count": 892},

    # Sports
    {"name": "Yoga Mat Pro", "slug": "yoga-mat-pro", "description": "6mm thick non-slip yoga mat with alignment lines. Extra-wide, moisture-resistant surface.", "price": 49.99, "original_price": 69.99, "image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600", "stock_quantity": 200, "brand": "FlexFlow", "category_slug": "sports", "is_featured": False, "is_trending": True, "rating": 4.6, "review_count": 2341},
    {"name": "Adjustable Dumbbell Set", "slug": "adjustable-dumbbell-set", "description": "Space-saving adjustable dumbbells 5-52.5 lbs. Quick-select dial system.", "price": 299.99, "original_price": 399.99, "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600", "stock_quantity": 25, "brand": "IronFlex", "category_slug": "sports", "is_featured": True, "is_trending": True, "rating": 4.7, "review_count": 567},
    {"name": "Smart Fitness Tracker", "slug": "smart-fitness-tracker", "description": "24/7 heart rate monitoring, sleep tracking, GPS, and 7-day battery life. Water resistant.", "price": 149.99, "original_price": 199.99, "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600", "stock_quantity": 85, "brand": "FitTrack", "category_slug": "sports", "is_featured": True, "is_trending": True, "rating": 4.5, "review_count": 1876},

    # Books
    {"name": "Atomic Habits", "slug": "atomic-habits", "description": "An easy and proven way to build good habits and break bad ones. James Clear's bestselling guide to lasting change.", "price": 18.99, "original_price": 27.99, "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600", "stock_quantity": 500, "brand": "Penguin Random House", "category_slug": "books", "is_featured": True, "is_trending": True, "rating": 4.9, "review_count": 87654},
    {"name": "The Psychology of Money", "slug": "psychology-of-money", "description": "Morgan Housel's timeless lessons on wealth, greed, and happiness.", "price": 16.99, "original_price": 24.99, "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600", "stock_quantity": 300, "brand": "Harriman House", "category_slug": "books", "is_featured": False, "is_trending": True, "rating": 4.8, "review_count": 43210},
    {"name": "Deep Work", "slug": "deep-work", "description": "Rules for focused success in a distracted world by Cal Newport.", "price": 15.99, "original_price": 22.99, "image_url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600", "stock_quantity": 250, "brand": "Grand Central Publishing", "category_slug": "books", "is_featured": False, "is_trending": False, "rating": 4.7, "review_count": 12345},

    # Beauty
    {"name": "Vitamin C Face Serum", "slug": "vitamin-c-serum", "description": "20% Vitamin C brightening serum with hyaluronic acid. Reduces dark spots and evens skin tone.", "price": 39.99, "original_price": 59.99, "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600", "stock_quantity": 175, "brand": "GlowLab", "category_slug": "beauty", "is_featured": False, "is_trending": True, "rating": 4.6, "review_count": 3456},
    {"name": "Hydrating Moisturizer SPF 50", "slug": "hydrating-moisturizer-spf50", "description": "Lightweight daily moisturizer with broad-spectrum SPF 50. Hydrates for 48 hours.", "price": 34.99, "original_price": 49.99, "image_url": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600", "stock_quantity": 220, "brand": "SkinGuard", "category_slug": "beauty", "is_featured": True, "is_trending": False, "rating": 4.5, "review_count": 2109},
]


def seed_database(db: Session) -> None:
    """Seed categories, products, and a demo admin user."""

    # Categories
    cat_map = {}
    for cat_data in CATEGORIES:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            cat = Category(**cat_data)
            db.add(cat)
            db.flush()
            cat_map[cat_data["slug"]] = cat.id
        else:
            cat_map[cat_data["slug"]] = existing.id
    db.commit()
    logger.info(f"Categories seeded: {len(CATEGORIES)}")

    # Products
    product_count = 0
    for p_data in PRODUCTS:
        existing = db.query(Product).filter(Product.slug == p_data["slug"]).first()
        if not existing:
            cat_slug = p_data.pop("category_slug")
            product = Product(**p_data, category_id=cat_map[cat_slug])
            db.add(product)
            product_count += 1
    db.commit()
    logger.info(f"Products seeded: {product_count}")

    # Demo user
    from app.models.user import User
    existing_user = db.query(User).filter(User.email == "demo@shopsphere.com").first()
    if not existing_user:
        user = User(
            email="demo@shopsphere.com",
            full_name="Demo User",
            hashed_password=hash_password("demo1234"),
        )
        db.add(user)
        db.commit()
        logger.info("Demo user created: demo@shopsphere.com / demo1234")

    # Admin user
    existing_admin = db.query(User).filter(User.email == "admin@shopsphere.com").first()
    if not existing_admin:
        admin = User(
            email="admin@shopsphere.com",
            full_name="Admin",
            hashed_password=hash_password("admin1234"),
            is_admin=True,
        )
        db.add(admin)
        db.commit()
        logger.info("Admin user created: admin@shopsphere.com / admin1234")


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        print("✅ Database seeded successfully.")
    finally:
        db.close()
