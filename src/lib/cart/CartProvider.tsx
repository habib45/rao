"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { CartItem, Product } from "@/types/domain";
import {
  getCartItems,
  addToCart as addToStorage,
  removeFromCart as removeFromStorage,
  updateCartQuantity as updateStorage,
  clearCart as clearStorage,
} from "./storage";

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCartItems());
  }, []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems(addToStorage(product, quantity));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(removeFromStorage(productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setItems(updateStorage(productId, quantity));
    },
    [],
  );

  const clear = useCallback(() => {
    setItems(clearStorage());
  }, []);

  return (
    <CartContext value={{ items, count, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
