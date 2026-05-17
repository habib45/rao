import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCartItems,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartCount,
} from "../storage";
import type { Product } from "@/types/domain";

describe("storage.ts", () => {
  const mockProduct: Product = {
    id: "prod-123",
    title: "Test Product",
    slug: "test-product",
    price: 99.99,
    currency: "USD",
    product_images: [],
    description: "Test description",
    brand: "Test Brand",
    category_id: "cat-123",
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock isBrowser to return true
    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getCartItems", () => {
    it("returns empty array when localStorage is empty", () => {
      const result = getCartItems();
      expect(result).toEqual([]);
    });

    it("returns parsed cart items from localStorage", () => {
      const items = [
        { product: mockProduct, quantity: 2 },
      ];
      localStorage.setItem("bestfinds_cart", JSON.stringify(items));
      const result = getCartItems();
      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe("prod-123");
      expect(result[0].quantity).toBe(2);
    });

    it("returns empty array on JSON parse error", () => {
      localStorage.setItem("bestfinds_cart", "invalid json");
      const result = getCartItems();
      expect(result).toEqual([]);
    });
  });

  describe("addToCart", () => {
    it("adds new product to cart", () => {
      const result = addToCart(mockProduct, 1);
      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe("prod-123");
      expect(result[0].quantity).toBe(1);
    });

    it("updates quantity if product already exists in cart", () => {
      addToCart(mockProduct, 1);
      const result = addToCart(mockProduct, 2);
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(3);
    });

    it("uses default quantity of 1", () => {
      const result = addToCart(mockProduct);
      expect(result[0].quantity).toBe(1);
    });
  });

  describe("removeFromCart", () => {
    it("removes product from cart", () => {
      addToCart(mockProduct, 1);
      const result = removeFromCart("prod-123");
      expect(result).toHaveLength(0);
    });

    it("returns unchanged cart if product not found", () => {
      const result = removeFromCart("non-existent");
      expect(result).toHaveLength(0);
    });
  });

  describe("updateCartQuantity", () => {
    it("updates product quantity", () => {
      addToCart(mockProduct, 1);
      const result = updateCartQuantity("prod-123", 5);
      expect(result[0].quantity).toBe(5);
    });

    it("removes product if quantity is 0", () => {
      addToCart(mockProduct, 1);
      const result = updateCartQuantity("prod-123", 0);
      expect(result).toHaveLength(0);
    });

    it("removes product if quantity is negative", () => {
      addToCart(mockProduct, 1);
      const result = updateCartQuantity("prod-123", -1);
      expect(result).toHaveLength(0);
    });

    it("returns unchanged cart if product not found", () => {
      const result = updateCartQuantity("non-existent", 5);
      expect(result).toHaveLength(0);
    });
  });

  describe("clearCart", () => {
    it("clears all items from cart", () => {
      addToCart(mockProduct, 1);
      const result = clearCart();
      expect(result).toHaveLength(0);
      expect(localStorage.getItem("bestfinds_cart")).toBeNull();
    });
  });

  describe("getCartCount", () => {
    it("returns 0 for empty cart", () => {
      const result = getCartCount();
      expect(result).toBe(0);
    });

    it("returns total quantity of all items", () => {
      const mockProduct2: Product = { ...mockProduct, id: "prod-456" };
      addToCart(mockProduct, 2);
      addToCart(mockProduct2, 3);
      const result = getCartCount();
      expect(result).toBe(5);
    });
  });
});
