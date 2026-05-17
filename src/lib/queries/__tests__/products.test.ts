import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/gateway", () => ({
  gwGetFeaturedProducts: vi.fn(),
  gwGetProductsByCategory: vi.fn(),
  gwGetProductsByCategoryLimit: vi.fn(),
  gwGetProductBySlug: vi.fn(),
  gwGetAllProducts: vi.fn(),
  gwGetProductsFiltered: vi.fn(),
  gwGetProductFilterMeta: vi.fn(),
  gwGetProductFilterMetaByCategory: vi.fn(),
  gwSearchProducts: vi.fn(),
  gwGetRelatedProducts: vi.fn(),
}));

import {
  gwGetFeaturedProducts,
  gwGetProductsByCategory,
  gwGetProductsByCategoryLimit,
  gwGetProductBySlug,
  gwGetAllProducts,
  gwGetProductsFiltered,
  gwGetProductFilterMeta,
  gwGetProductFilterMetaByCategory,
  gwSearchProducts,
  gwGetRelatedProducts,
} from "@/lib/api/gateway";
import {
  getFeaturedProducts,
  getProductsByCategory,
  getProductsByCategoryLimit,
  getProductBySlug,
  getAllProducts,
  getProductsFiltered,
  getProductFilterMeta,
  getProductFilterMetaByCategory,
  searchProducts,
  getRelatedProducts,
} from "../products";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("products.ts", () => {
  describe("getFeaturedProducts", () => {
    it("calls gwGetFeaturedProducts", async () => {
      vi.mocked(gwGetFeaturedProducts).mockResolvedValue([]);
      await getFeaturedProducts();
      expect(gwGetFeaturedProducts).toHaveBeenCalled();
    });
  });

  describe("getProductsByCategory", () => {
    it("calls gwGetProductsByCategory with categoryId", async () => {
      vi.mocked(gwGetProductsByCategory).mockResolvedValue([]);
      await getProductsByCategory("cat-123");
      expect(gwGetProductsByCategory).toHaveBeenCalledWith("cat-123");
    });
  });

  describe("getProductsByCategoryLimit", () => {
    it("calls gwGetProductsByCategoryLimit with categoryId and limit", async () => {
      vi.mocked(gwGetProductsByCategoryLimit).mockResolvedValue([]);
      await getProductsByCategoryLimit("cat-123", 10);
      expect(gwGetProductsByCategoryLimit).toHaveBeenCalledWith("cat-123", 10);
    });
  });

  describe("getProductBySlug", () => {
    it("calls gwGetProductBySlug with slug and locale", async () => {
      vi.mocked(gwGetProductBySlug).mockResolvedValue(null);
      await getProductBySlug("test-product", "en");
      expect(gwGetProductBySlug).toHaveBeenCalledWith("test-product", "en");
    });
  });

  describe("getAllProducts", () => {
    it("calls gwGetAllProducts", async () => {
      vi.mocked(gwGetAllProducts).mockResolvedValue([]);
      await getAllProducts();
      expect(gwGetAllProducts).toHaveBeenCalled();
    });
  });

  describe("getProductsFiltered", () => {
    it("calls gwGetProductsFiltered with params", async () => {
      vi.mocked(gwGetProductsFiltered).mockResolvedValue({
        products: [],
        total: 0,
      });
      await getProductsFiltered({
        categoryIds: ["cat-123"],
        page: 1,
        pageSize: 20,
      });
      expect(gwGetProductsFiltered).toHaveBeenCalled();
    });
  });

  describe("getProductFilterMeta", () => {
    it("calls gwGetProductFilterMeta", async () => {
      vi.mocked(gwGetProductFilterMeta).mockResolvedValue({
        brands: [],
      });
      await getProductFilterMeta();
      expect(gwGetProductFilterMeta).toHaveBeenCalled();
    });
  });

  describe("getProductFilterMetaByCategory", () => {
    it("calls gwGetProductFilterMetaByCategory with categoryId", async () => {
      vi.mocked(gwGetProductFilterMetaByCategory).mockResolvedValue({
        brands: [],
      });
      await getProductFilterMetaByCategory("cat-123");
      expect(gwGetProductFilterMetaByCategory).toHaveBeenCalledWith("cat-123");
    });
  });

  describe("searchProducts", () => {
    it("calls gwSearchProducts with query, locale, and default pagination", async () => {
      vi.mocked(gwSearchProducts).mockResolvedValue({
        products: [],
        total: 0,
      });
      await searchProducts("wireless headphones", "en");
      expect(gwSearchProducts).toHaveBeenCalledWith("wireless headphones", "en", 1, 12);
    });
  });

  describe("getRelatedProducts", () => {
    it("calls gwGetRelatedProducts with productId and categoryId", async () => {
      vi.mocked(gwGetRelatedProducts).mockResolvedValue([]);
      await getRelatedProducts("prod-123", "cat-456", 4);
      expect(gwGetRelatedProducts).toHaveBeenCalledWith("prod-123", "cat-456", 4);
    });
  });
});
