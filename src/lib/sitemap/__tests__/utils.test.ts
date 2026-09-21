import { describe, it, expect } from "vitest";
import { extractSlugFromUrl, getUrlType, isDevelopmentUrl } from "../utils";

describe("sitemap utils", () => {
  describe("extractSlugFromUrl", () => {
    it("should extract slug from locale-prefixed product URL", () => {
      const url = "https://example.com/en/products/test-product";
      expect(extractSlugFromUrl(url)).toBe("products/test-product");
    });

    it("should extract slug from locale-prefixed category URL", () => {
      const url = "https://example.com/en/categories/electronics";
      expect(extractSlugFromUrl(url)).toBe("categories/electronics");
    });

    it("should extract slug from locale-prefixed blog post URL", () => {
      const url = "https://example.com/en/blog/my-post";
      expect(extractSlugFromUrl(url)).toBe("blog/my-post");
    });

    it("should extract slug from locale-prefixed blog category URL", () => {
      const url = "https://example.com/en/blog/category/tech";
      expect(extractSlugFromUrl(url)).toBe("blog/category/tech");
    });

    it("should extract slug from non-locale URL", () => {
      const url = "https://example.com/products/test-product";
      expect(extractSlugFromUrl(url)).toBe("products/test-product");
    });

    it("should extract slug from root path", () => {
      const url = "https://example.com/";
      expect(extractSlugFromUrl(url)).toBe(null);
    });

    it("should extract slug from simple path", () => {
      const url = "https://example.com/about";
      expect(extractSlugFromUrl(url)).toBe("about");
    });

    it("should handle Bengali locale", () => {
      const url = "https://example.com/bn-BD/products/test-product";
      expect(extractSlugFromUrl(url)).toBe("products/test-product");
    });

    it("should handle Swedish locale", () => {
      const url = "https://example.com/sv/categories/electronics";
      expect(extractSlugFromUrl(url)).toBe("categories/electronics");
    });

    it("should return null for invalid URL", () => {
      const url = "not-a-valid-url";
      expect(extractSlugFromUrl(url)).toBe(null);
    });
  });

  describe("getUrlType", () => {
    it("should identify product URLs", () => {
      expect(getUrlType("https://example.com/en/products/test")).toBe("product");
      expect(getUrlType("https://example.com/products/test")).toBe("product");
    });

    it("should identify category URLs", () => {
      expect(getUrlType("https://example.com/en/categories/electronics")).toBe("category");
      expect(getUrlType("https://example.com/categories/electronics")).toBe("category");
    });

    it("should identify blog post URLs", () => {
      expect(getUrlType("https://example.com/en/blog/my-post")).toBe("blog_post");
      expect(getUrlType("https://example.com/blog/my-post")).toBe("blog_post");
    });

    it("should identify blog category URLs", () => {
      expect(getUrlType("https://example.com/en/blog/category/tech")).toBe("blog_category");
      expect(getUrlType("https://example.com/blog/category/tech")).toBe("blog_category");
    });

    it("should identify static URLs", () => {
      expect(getUrlType("https://example.com/")).toBe("static");
      expect(getUrlType("https://example.com/about")).toBe("static");
      expect(getUrlType("https://example.com/en/about")).toBe("static");
    });

    it("should return unknown for invalid URLs", () => {
      expect(getUrlType("not-a-url")).toBe("unknown");
    });
  });

  describe("isDevelopmentUrl", () => {
    it("should identify localhost URLs", () => {
      expect(isDevelopmentUrl("http://localhost:3000")).toBe(true);
      expect(isDevelopmentUrl("https://localhost:3000")).toBe(true);
    });

    it("should identify 127.0.0.1 URLs", () => {
      expect(isDevelopmentUrl("http://127.0.0.1:3000")).toBe(true);
      expect(isDevelopmentUrl("https://127.0.0.1:3000")).toBe(true);
    });

    it("should identify HTTP URLs", () => {
      expect(isDevelopmentUrl("http://example.com")).toBe(true);
    });

    it("should identify production HTTPS URLs", () => {
      expect(isDevelopmentUrl("https://example.com")).toBe(false);
      expect(isDevelopmentUrl("https://www.example.com")).toBe(false);
    });
  });
});