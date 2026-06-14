import { describe, it, expect, vi, beforeEach } from "vitest";
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
  gwGetPublishedBlogPosts,
  gwGetFeaturedBlogPosts,
  gwGetTrendingBlogPosts,
  gwGetBlogPostBySlug,
  gwGetActiveBlogCategories,
  gwGetBlogPostsByCategory,
  gwGetBlogCategoryBySlug,
  gwGetRelatedBlogPosts,
  gwGetPublishedBlogPostsCount,
  gwGetApprovedBlogComments,
  gwGetAllPublishedSlugs,
  gwGetAllActiveCategorySlugs,
  gwGetActiveCategories,
  gwGetCategoryBySlug,
  gwGetComparisonKeys,
  gwGetSiteSettings,
} from "../gateway";

// Mock the environment variable
process.env.NEXT_PUBLIC_MYSQL_API_URL = "http://localhost:4000";
process.env.MYSQL_API_SECRET = "change-me-in-production";

vi.mock("server-only", () => ({}));

describe("gateway.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Product Gateway Functions", () => {
    it("gwGetFeaturedProducts calls /api/products with featured flag", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      await gwGetFeaturedProducts();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
          next: expect.objectContaining({ revalidate: 60 }),
        }),
      );
    });

    it("gwGetFeaturedProducts triggers adaptProductRow with primary_image_url", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "prod-123",
              title: "Test Product",
              primary_image_url: "https://example.com/image.jpg",
            },
          ],
        }),
      } as unknown as Response);

      const result = await gwGetFeaturedProducts();
      expect(result).toHaveLength(1);
      expect(result[0].product_images).toHaveLength(1);
      expect(result[0].product_images[0].url).toBe("https://example.com/image.jpg");
    });

    it("gwGetFeaturedProducts triggers adaptProductRow without primary_image_url", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "prod-456",
              title: "Product Without Image",
              primary_image_url: null,
            },
          ],
        }),
      } as unknown as Response);

      const result = await gwGetFeaturedProducts();
      expect(result).toHaveLength(1);
      expect(result[0].product_images).toHaveLength(0);
    });

    it("gwGetProductsByCategory calls /api/products with category_id", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetProductsByCategory("cat-123");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetProductsByCategory handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetProductsByCategory("cat-123");
      expect(result).toEqual([]);
    });

    it("gwGetProductsByCategoryLimit calls /api/products with category_id and limit", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetProductsByCategoryLimit("cat-123", 10);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetProductsByCategoryLimit handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetProductsByCategoryLimit("cat-123", 10);
      expect(result).toEqual([]);
    });

    it("gwGetProductBySlug calls /api/products with slug and locale", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      await gwGetProductBySlug("test-product", "en");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetProductBySlug handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetProductBySlug("test-product", "en");
      expect(result).toBeNull();
    });

    it("gwGetProductBySlug calls adaptProductDetail when product found", async () => {
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => ({ data: [{ id: "prod-123" }] }),
          } as unknown as Response;
        } else {
          return {
            ok: true,
            json: async () => ({
              id: "prod-123",
              title: "Test Product",
              images: [
                { id: "img-1", url: "https://example.com/image1.jpg", alt_text: {}, width: 800, height: 600, sort_order: 0, is_primary: true },
                { id: "img-2", url: "https://example.com/image2.jpg", alt_text: {}, width: 800, height: 600, sort_order: 1, is_primary: false },
              ],
            }),
          } as unknown as Response;
        }
      });

      const result = await gwGetProductBySlug("test-product", "en");
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result?.product_images).toHaveLength(2);
    });

    it("gwGetAllProducts calls /api/products", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetAllProducts();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetAllProducts handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetAllProducts();
      expect(result).toEqual([]);
    });

    it("gwGetAllProducts handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetAllProducts();
      expect(result).toEqual([]);
    });

    it("gwSearchProducts calls /api/products with search query and locale", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      } as unknown as Response);

      await gwSearchProducts("wireless headphones", "en");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.any(Object),
      );
    });

    it("gwSearchProducts handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwSearchProducts("wireless headphones", "en");
      expect(result).toEqual({ products: [], total: 0 });
    });

    it("gwGetRelatedProducts calls /api/products with related flag", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetRelatedProducts("prod-123", "cat-456", 4);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetRelatedProducts handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetRelatedProducts("prod-123", "cat-456", 4);
      expect(result).toEqual([]);
    });

    it("gwGetProductsFiltered calls /api/products with filters", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      } as unknown as Response);

      await gwGetProductsFiltered({ categoryIds: ["cat-123"], page: 1, pageSize: 20 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetProductsFiltered handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetProductsFiltered({ categoryIds: ["cat-123"], page: 1, pageSize: 20 });
      expect(result).toEqual({ products: [], total: 0 });
    });

    it("gwGetProductFilterMeta calls /api/products to get brands", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      await gwGetProductFilterMeta();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/products"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetProductFilterMeta handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetProductFilterMeta();
      expect(result).toEqual({ brands: [] });
    });

    it("gwGetProductFilterMetaByCategory calls /api/products with category_id", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ brand: "Sony" }, { brand: "Samsung" }, { brand: null }, { brand: "" }] }),
      } as unknown as Response);

      const result = await gwGetProductFilterMetaByCategory("cat-123");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/products?category_id=cat-123&is_active=true&limit=1000",
        expect.any(Object),
      );
      expect(result).toEqual({ brands: ["Samsung", "Sony"] });
    });

    it("gwGetProductFilterMetaByCategory handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetProductFilterMetaByCategory("cat-123");
      expect(result).toEqual({ brands: [] });
    });
  });

  describe("Blog Gateway Functions", () => {
    it("gwGetPublishedBlogPosts calls /api/blog with pagination", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetPublishedBlogPosts(20, 0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetPublishedBlogPosts handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetPublishedBlogPosts(20, 0);
      expect(result).toEqual([]);
    });

    it("gwGetPublishedBlogPosts triggers adaptBlogPost with tags", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "post-123",
              title: "Test Post",
              tags: [
                { id: "tag-1", name: "Technology", slug: "technology" },
                { id: "tag-2", name: "News", slug: "news" },
              ],
            },
          ],
        }),
      } as unknown as Response);

      const result = await gwGetPublishedBlogPosts(20, 0);
      expect(result).toHaveLength(1);
      expect(result[0]?.blog_post_tags).toHaveLength(2);
      const tagName = result[0]?.blog_post_tags[0]?.blog_tags?.name;
      expect(tagName).toBe("Technology");
    });

    it("gwGetFeaturedBlogPosts calls /api/blog with featured flag", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetFeaturedBlogPosts(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetTrendingBlogPosts calls /api/blog with trending flag", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetTrendingBlogPosts(5);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetBlogPostBySlug calls /api/blog with slug", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => null,
      } as unknown as Response);

      await gwGetBlogPostBySlug("test-post");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetBlogPostBySlug handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetBlogPostBySlug("test-post");
      expect(result).toBeNull();
    });

    it("gwGetBlogPostsByCategory calls /api/blog/posts with category_id", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      await gwGetBlogPostsByCategory("cat-123");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/posts"),
        expect.any(Object),
      );
    });

    it("gwGetBlogPostsByCategory handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetBlogPostsByCategory("cat-123");
      expect(result).toEqual([]);
    });

    it("gwGetBlogCategoryBySlug calls /api/blog/categories and filters", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, slug: { en: "tech", "bn-BD": "টেক", sv: "teknik" } },
          { id: 2, slug: { en: "news", "bn-BD": "খবর", sv: "nyheter" } },
        ],
      } as unknown as Response);

      const result = await gwGetBlogCategoryBySlug("tech");
      expect(result).toEqual({ id: 1, slug: { en: "tech", "bn-BD": "টেক", sv: "teknik" } });
    });

    it("gwGetBlogCategoryBySlug returns null when not found", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, slug: { en: "tech", "bn-BD": "টেক", sv: "teknik" } },
        ],
      } as unknown as Response);

      const result = await gwGetBlogCategoryBySlug("nonexistent");
      expect(result).toBeNull();
    });

    it("gwGetBlogCategoryBySlug handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetBlogCategoryBySlug("tech");
      expect(result).toBeNull();
    });

    it("gwGetRelatedBlogPosts calls /api/blog/posts with category_id", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      await gwGetRelatedBlogPosts("post-123", "cat-456");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/posts"),
        expect.any(Object),
      );
    });

    it("gwGetRelatedBlogPosts handles null categoryId", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      await gwGetRelatedBlogPosts("post-123", null);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/posts"),
        expect.any(Object),
      );
    });

    it("gwGetRelatedBlogPosts handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetRelatedBlogPosts("post-123", "cat-456");
      expect(result).toEqual([]);
    });

    it("gwGetActiveBlogCategories calls /api/blog/categories", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetActiveBlogCategories();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/categories"),
        expect.any(Object),
      );
    });

    it("gwGetActiveBlogCategories handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetActiveBlogCategories();
      expect(result).toEqual([]);
    });

    it("gwGetPublishedBlogPostsCount calls /api/blog/posts with count=true", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ total: 10 }),
      } as unknown as Response);

      await gwGetPublishedBlogPostsCount();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/posts"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetPublishedBlogPostsCount handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetPublishedBlogPostsCount();
      expect(result).toBe(0);
    });

    it("gwGetApprovedBlogComments calls /api/blog/posts/{id}/comments", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetApprovedBlogComments("post-123");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/posts/post-123/comments"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetApprovedBlogComments handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetApprovedBlogComments("post-123");
      expect(result).toEqual([]);
    });

    it("gwGetAllPublishedSlugs calls /api/blog/posts to get slugs", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [
          { id: "1", slug: { en: "test-post", "bn-BD": "টেস্ট", sv: "test" }, updated_at: "2024-01-01" },
        ],
      } as unknown as Response);

      await gwGetAllPublishedSlugs();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/posts"),
        expect.any(Object),
      );
    });

    it("gwGetAllPublishedSlugs maps slug data correctly", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [
          { id: "1", slug: { en: "test-post", "bn-BD": "টেস্ট", sv: "test" }, updated_at: "2024-01-01" },
        ],
      } as unknown as Response);

      const result = await gwGetAllPublishedSlugs();
      expect(result).toEqual([
        { en: "test-post", "bn-BD": "টেস্ট", sv: "test", updated_at: "2024-01-01" },
      ]);
    });

    it("gwGetAllPublishedSlugs handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetAllPublishedSlugs();
      expect(result).toEqual([]);
    });

    it("gwGetAllActiveCategorySlugs calls /api/blog/categories", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetAllActiveCategorySlugs();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/blog/categories"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetAllActiveCategorySlugs handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetAllActiveCategorySlugs();
      expect(result).toEqual([]);
    });
  });

  describe("Category Gateway Functions", () => {
    it("gwGetActiveCategories calls /api/categories", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetActiveCategories();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/categories"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetActiveCategories handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetActiveCategories();
      expect(result).toEqual([]);
    });

    it("gwGetCategoryBySlug calls /api/categories and filters", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as unknown as Response);

      await gwGetCategoryBySlug("electronics", "en");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/categories"),
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it("gwGetCategoryBySlug handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetCategoryBySlug("electronics", "en");
      expect(result).toBeNull();
    });

    it("gwGetCategoryBySlug finds category by slug", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [{ slug: { en: "electronics", "bn-BD": "ইলেকট্রনিক্স" } }],
      } as unknown as Response);

      const result = await gwGetCategoryBySlug("electronics", "en");
      expect(result).toBeDefined();
      expect(result?.slug).toEqual({ en: "electronics", "bn-BD": "ইলেকট্রনিক্স" });
    });
  });

  describe("Settings Gateway Functions", () => {
    it("gwGetComparisonKeys calls /api/admin/settings with auth", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ comparison: { keys: ["key1", "key2"] } }),
      } as unknown as Response);

      await gwGetComparisonKeys();
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      expect(fetchCall[0]).toContain("/api/admin/settings");
      expect(fetchCall[1]?.headers).toBeDefined();
    });

    it("gwGetComparisonKeys handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetComparisonKeys();
      expect(result).toEqual([]);
    });

    it("gwGetSiteSettings calls /api/admin/settings with auth", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ features: { show_price: true } }),
      } as unknown as Response);

      await gwGetSiteSettings();
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      expect(fetchCall[0]).toContain("/api/admin/settings");
      expect(fetchCall[1]?.headers).toBeDefined();
    });

    it("gwGetSiteSettings handles errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
      const result = await gwGetSiteSettings();
      expect(result).toEqual({ showPrice: true });
    });
  });

  describe("Error Handling", () => {
    it("handles fetch errors gracefully", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      const result = await gwGetFeaturedProducts();
      expect(result).toEqual([]);
    });

    it("handles non-OK responses gracefully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as unknown as Response);

      const result = await gwGetFeaturedProducts();
      expect(result).toEqual([]);
    });

    it("handles JSON parse errors gracefully", async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Response);

      const result = await gwGetFeaturedProducts();
      expect(result).toEqual([]);
    });
  });
});
