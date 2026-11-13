"""Tests for cart operations."""
import pytest


def test_get_cart_unauthenticated(client):
    resp = client.get("/api/cart")
    assert resp.status_code in (401, 403)


def test_get_empty_cart(client, auth_headers):
    resp = client.get("/api/cart", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_add_item_to_cart(client, auth_headers, seed_products):
    product_id = seed_products[0].id
    resp = client.post("/api/cart/items", headers=auth_headers, json={
        "product_id": product_id, "quantity": 2
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["item_count"] == 2
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product_id


def test_add_invalid_product(client, auth_headers):
    resp = client.post("/api/cart/items", headers=auth_headers, json={
        "product_id": 99999, "quantity": 1
    })
    assert resp.status_code == 404


def test_update_cart_item(client, auth_headers, seed_products):
    # Add item first
    product_id = seed_products[0].id
    add_resp = client.post("/api/cart/items", headers=auth_headers, json={
        "product_id": product_id, "quantity": 1
    })
    assert add_resp.status_code == 201
    item_id = add_resp.json()["items"][0]["id"]

    # Update quantity
    resp = client.patch(f"/api/cart/items/{item_id}", headers=auth_headers, json={"quantity": 3})
    assert resp.status_code == 200
    assert resp.json()["items"][0]["quantity"] == 3


def test_remove_cart_item(client, auth_headers, seed_products):
    product_id = seed_products[0].id
    add_resp = client.post("/api/cart/items", headers=auth_headers, json={
        "product_id": product_id, "quantity": 1
    })
    item_id = add_resp.json()["items"][0]["id"]

    resp = client.delete(f"/api/cart/items/{item_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["items"] == []


def test_cart_total_calculation(client, auth_headers, seed_products):
    p = seed_products[0]
    client.post("/api/cart/items", headers=auth_headers, json={"product_id": p.id, "quantity": 2})
    resp = client.get("/api/cart", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    expected_total = round(p.price * 2, 2)
    assert abs(data["total"] - expected_total) < 0.01
