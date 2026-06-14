import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "../CartProvider";
import type { Product } from "@/types/domain";

describe("CartProvider.tsx", () => {
  const mockProduct: Product = {
    id: "prod-123",
    asin: "B000000",
    name: { en: "Test Product" },
    slug: { en: "test-product" },
    price_cents: 9999,
    currency: "USD",
    product_images: [],
    description: { en: "Test description" },
    features: [],
    meta_title: { en: "Test Product" },
    meta_description: { en: "Test description" },
    original_price_cents: null,
    discount_pct: 0,
    rating: null,
    review_count: 0,
    affiliate_url: "https://amazon.com/test",
    brand: "Test Brand",
    category_id: "cat-123",
    availability: "in_stock",
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

    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("CartProvider", () => {
    it("renders children", () => {
      render(
        <CartProvider>
          <div>Test Child</div>
        </CartProvider>,
      );
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("loads initial state from storage", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.count).toBe(0);
    });
  });

  describe("useCart hook", () => {
    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useCart());
      }).toThrow("useCart must be used within a CartProvider");
    });

    it("provides addItem function", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem(mockProduct, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe("prod-123");
      expect(result.current.count).toBe(1);
    });

    it("uses default quantity of 1", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.items[0].quantity).toBe(1);
    });

    it("provides removeItem function", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem(mockProduct, 1);
      });

      act(() => {
        result.current.removeItem("prod-123");
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.count).toBe(0);
    });

    it("provides updateQuantity function", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem(mockProduct, 1);
      });

      act(() => {
        result.current.updateQuantity("prod-123", 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.count).toBe(5);
    });

    it("provides clear function", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem(mockProduct, 1);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.count).toBe(0);
    });

    it("calculates count correctly for multiple items", () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const mockProduct2: Product = { ...mockProduct, id: "prod-456" };

      act(() => {
        result.current.addItem(mockProduct, 2);
        result.current.addItem(mockProduct2, 3);
      });

      expect(result.current.count).toBe(5);
    });
  });
});
