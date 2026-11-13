"""Tests for product and category endpoints."""
import pytest


def test_list_products(client, seed_products):
    resp = client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 2
    assert all("price" in p for p in data["items"])


def test_get_product_by_id(client, seed_products):
    product_id = seed_products[0].id
    resp = client.get(f"/api/products/{product_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == product_id
    assert data["name"] == "Test Phone"
    assert "category" in data


def test_get_product_not_found(client):
    resp = client.get("/api/products/99999")
    assert resp.status_code == 404


def test_list_categories(client, seed_categories):
    resp = client.get("/api/products/categories")
    assert resp.status_code == 200
    cats = resp.json()
    assert len(cats) >= 2
    slugs = [c["slug"] for c in cats]
    assert "electronics" in slugs


def test_product_search(client, seed_products):
    resp = client.get("/api/products?search=Phone")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any("Phone" in p["name"] for p in data["items"])


def test_product_filter_by_category(client, seed_products, seed_categories):
    cat_id = seed_categories[0].id
    resp = client.get(f"/api/products?category_id={cat_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert all(p["category_id"] == cat_id for p in data["items"])


def test_product_featured_filter(client, seed_products):
    resp = client.get("/api/products?featured=true")
    assert resp.status_code == 200
    data = resp.json()
    assert all(p["is_featured"] for p in data["items"])


def test_product_price_filter(client, seed_products):
    resp = client.get("/api/products?max_price=50")
    assert resp.status_code == 200
    data = resp.json()
    assert all(p["price"] <= 50 for p in data["items"])


def test_product_sorting(client, seed_products):
    resp = client.get("/api/products?sort_by=price&sort_order=asc")
    assert resp.status_code == 200
    data = resp.json()
    prices = [p["price"] for p in data["items"]]
    assert prices == sorted(prices)


def test_product_pagination(client, seed_products):
    resp = client.get("/api/products?page=1&page_size=1")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["page"] == 1
    assert data["page_size"] == 1
