/**
 * Cart context — fetches, caches, and updates the user's cart.
 * Re-syncs with the backend on every add/remove/update.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem } from '../types';
import api, { getErrorMessage } from '../lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearError: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setCart(null); return; }
    try {
      setIsLoading(true);
      const res = await api.get<Cart>('/cart');
      setCart(res.data);
    } catch (e) {
      // Don't show error on cart fetch — just leave cart empty
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (productId: number, quantity = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<Cart>('/cart/items', { product_id: productId, quantity });
      setCart(res.data);
    } catch (e) {
      setError(getErrorMessage(e));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
      setCart(res.data);
    } catch (e) {
      setError(getErrorMessage(e));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.delete<Cart>(`/cart/items/${itemId}`);
      setCart(res.data);
    } catch (e) {
      setError(getErrorMessage(e));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearError: () => setError(null),
        itemCount: cart?.item_count ?? 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
