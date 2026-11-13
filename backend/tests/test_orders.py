"""Tests for order creation and retrieval."""
import pytest

ORDER_PAYLOAD = {
    "shipping": {
        "name": "Test User",
        "email": "test@example.com",
        "address": "123 Test St",
        "city": "Test City",
        "zip_code": "12345",
        "country": "US",
    },
    "payment_method": "mock_card",
    "card_last_four": "4242",
}


def _seed_cart(client, headers, seed_products):
    client.post("/api/cart/items", headers=headers, json={
        "product_id": seed_products[0].id, "quantity": 1
    })


def test_create_order_empty_cart(client, auth_headers):
    resp = client.post("/api/orders", headers=auth_headers, json=ORDER_PAYLOAD)
    assert resp.status_code == 400


def test_create_order_success(client, auth_headers, seed_products):
    _seed_cart(client, auth_headers, seed_products)
    resp = client.post("/api/orders", headers=auth_headers, json=ORDER_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["order_number"].startswith("ORD-")
    assert data["status"] in ("confirmed", "cancelled")
    assert "payment" in data
    assert len(data["items"]) == 1


def test_create_order_clears_cart(client, auth_headers, seed_products):
    _seed_cart(client, auth_headers, seed_products)
    client.post("/api/orders", headers=auth_headers, json=ORDER_PAYLOAD)
    cart_resp = client.get("/api/cart", headers=auth_headers)
    assert cart_resp.json()["item_count"] == 0


def test_list_orders(client, auth_headers, seed_products):
    _seed_cart(client, auth_headers, seed_products)
    client.post("/api/orders", headers=auth_headers, json=ORDER_PAYLOAD)
    resp = client.get("/api/orders", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


def test_get_order_by_id(client, auth_headers, seed_products):
    _seed_cart(client, auth_headers, seed_products)
    create_resp = client.post("/api/orders", headers=auth_headers, json=ORDER_PAYLOAD)
    order_id = create_resp.json()["id"]

    resp = client.get(f"/api/orders/{order_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == order_id


def test_get_order_unauthorized(client, auth_headers, seed_products):
    _seed_cart(client, auth_headers, seed_products)
    create_resp = client.post("/api/orders", headers=auth_headers, json=ORDER_PAYLOAD)
    order_id = create_resp.json()["id"]

    # Another user should not access this order
    other_resp = client.post("/api/auth/register", json={
        "email": "other@example.com", "full_name": "Other", "password": "password123"
    })
    other_token = other_resp.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    resp = client.get(f"/api/orders/{order_id}", headers=other_headers)
    assert resp.status_code == 404


def test_orders_unauthenticated(client):
    resp = client.get("/api/orders")
    assert resp.status_code in (401, 403)
