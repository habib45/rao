import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/gateway", () => ({
  gwGetPublishedBlogPosts: vi.fn(),
  gwGetFeaturedBlogPosts: vi.fn(),
  gwGetTrendingBlogPosts: vi.fn(),
  gwGetBlogPostBySlug: vi.fn(),
  gwGetActiveBlogCategories: vi.fn(),
  gwGetBlogPostsByCategory: vi.fn(),
  gwGetBlogCategoryBySlug: vi.fn(),
  gwGetRelatedBlogPosts: vi.fn(),
  gwGetPublishedBlogPostsCount: vi.fn(),
  gwGetApprovedBlogComments: vi.fn(),
  gwGetAllPublishedSlugs: vi.fn(),
  gwGetAllActiveCategorySlugs: vi.fn(),
}));

import {
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
} from "@/lib/api/gateway";
import {
  getPublishedBlogPosts,
  getFeaturedBlogPosts,
  getTrendingBlogPosts,
  getBlogPostBySlug,
  getActiveBlogCategories,
  getBlogPostsByCategory,
  getBlogCategoryBySlug,
  getRelatedBlogPosts,
  getPublishedBlogPostsCount,
  getApprovedBlogComments,
  getAllPublishedSlugs,
  getAllActiveCategorySlugs,
} from "../blog";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("blog.ts", () => {
  describe("getPublishedBlogPosts", () => {
    it("calls gwGetPublishedBlogPosts with default params", async () => {
      vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
      await getPublishedBlogPosts();
      expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(20, 0, undefined, undefined);
    });

    it("calls gwGetPublishedBlogPosts with custom params", async () => {
      vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
      await getPublishedBlogPosts(10, 5, "cat-123", "search");
      expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(10, 5, "cat-123", "search");
    });
  });

  describe("getFeaturedBlogPosts", () => {
    it("calls gwGetFeaturedBlogPosts with default limit", async () => {
      vi.mocked(gwGetFeaturedBlogPosts).mockResolvedValue([]);
      await getFeaturedBlogPosts();
      expect(gwGetFeaturedBlogPosts).toHaveBeenCalledWith(3);
    });

    it("calls gwGetFeaturedBlogPosts with custom limit", async () => {
      vi.mocked(gwGetFeaturedBlogPosts).mockResolvedValue([]);
      await getFeaturedBlogPosts(5);
      expect(gwGetFeaturedBlogPosts).toHaveBeenCalledWith(5);
    });
  });

  describe("getTrendingBlogPosts", () => {
    it("calls gwGetTrendingBlogPosts with default limit", async () => {
      vi.mocked(gwGetTrendingBlogPosts).mockResolvedValue([]);
      await getTrendingBlogPosts();
      expect(gwGetTrendingBlogPosts).toHaveBeenCalledWith(5);
    });

    it("calls gwGetTrendingBlogPosts with custom limit", async () => {
      vi.mocked(gwGetTrendingBlogPosts).mockResolvedValue([]);
      await getTrendingBlogPosts(10);
      expect(gwGetTrendingBlogPosts).toHaveBeenCalledWith(10);
    });
  });

  describe("getBlogPostBySlug", () => {
    it("calls gwGetBlogPostBySlug with slug", async () => {
      vi.mocked(gwGetBlogPostBySlug).mockResolvedValue(null);
      await getBlogPostBySlug("test-post");
      expect(gwGetBlogPostBySlug).toHaveBeenCalledWith("test-post");
    });
  });

  describe("getActiveBlogCategories", () => {
    it("calls gwGetActiveBlogCategories", async () => {
      vi.mocked(gwGetActiveBlogCategories).mockResolvedValue([]);
      await getActiveBlogCategories();
      expect(gwGetActiveBlogCategories).toHaveBeenCalled();
    });
  });

  describe("getBlogPostsByCategory", () => {
    it("calls gwGetBlogPostsByCategory with default limit", async () => {
      vi.mocked(gwGetBlogPostsByCategory).mockResolvedValue([]);
      await getBlogPostsByCategory("cat-123");
      expect(gwGetBlogPostsByCategory).toHaveBeenCalledWith("cat-123", 12);
    });

    it("calls gwGetBlogPostsByCategory with custom limit", async () => {
      vi.mocked(gwGetBlogPostsByCategory).mockResolvedValue([]);
      await getBlogPostsByCategory("cat-123", 20);
      expect(gwGetBlogPostsByCategory).toHaveBeenCalledWith("cat-123", 20);
    });
  });

  describe("getBlogCategoryBySlug", () => {
    it("calls gwGetBlogCategoryBySlug with slug", async () => {
      vi.mocked(gwGetBlogCategoryBySlug).mockResolvedValue(null);
      await getBlogCategoryBySlug("test-category");
      expect(gwGetBlogCategoryBySlug).toHaveBeenCalledWith("test-category");
    });
  });

  describe("getRelatedBlogPosts", () => {
    it("calls gwGetRelatedBlogPosts with default limit", async () => {
      vi.mocked(gwGetRelatedBlogPosts).mockResolvedValue([]);
      await getRelatedBlogPosts("post-123", "cat-456");
      expect(gwGetRelatedBlogPosts).toHaveBeenCalledWith("post-123", "cat-456", 3);
    });

    it("calls gwGetRelatedBlogPosts with custom limit", async () => {
      vi.mocked(gwGetRelatedBlogPosts).mockResolvedValue([]);
      await getRelatedBlogPosts("post-123", "cat-456", 5);
      expect(gwGetRelatedBlogPosts).toHaveBeenCalledWith("post-123", "cat-456", 5);
    });
  });

  describe("getPublishedBlogPostsCount", () => {
    it("calls gwGetPublishedBlogPostsCount with default params", async () => {
      vi.mocked(gwGetPublishedBlogPostsCount).mockResolvedValue(10);
      await getPublishedBlogPostsCount();
      expect(gwGetPublishedBlogPostsCount).toHaveBeenCalledWith(undefined, undefined);
    });

    it("calls gwGetPublishedBlogPostsCount with params", async () => {
      vi.mocked(gwGetPublishedBlogPostsCount).mockResolvedValue(5);
      await getPublishedBlogPostsCount("cat-123", "search");
      expect(gwGetPublishedBlogPostsCount).toHaveBeenCalledWith("cat-123", "search");
    });
  });

  describe("getApprovedBlogComments", () => {
    it("calls gwGetApprovedBlogComments with postId", async () => {
      vi.mocked(gwGetApprovedBlogComments).mockResolvedValue([]);
      await getApprovedBlogComments("post-123");
      expect(gwGetApprovedBlogComments).toHaveBeenCalledWith("post-123");
    });
  });

  describe("getAllPublishedSlugs", () => {
    it("calls gwGetAllPublishedSlugs", async () => {
      vi.mocked(gwGetAllPublishedSlugs).mockResolvedValue([]);
      await getAllPublishedSlugs();
      expect(gwGetAllPublishedSlugs).toHaveBeenCalled();
    });
  });

  describe("getAllActiveCategorySlugs", () => {
    it("calls gwGetAllActiveCategorySlugs", async () => {
      vi.mocked(gwGetAllActiveCategorySlugs).mockResolvedValue([]);
      await getAllActiveCategorySlugs();
      expect(gwGetAllActiveCategorySlugs).toHaveBeenCalled();
    });
  });
});
