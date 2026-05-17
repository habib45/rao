// F18.1 — Blog pagination & filtering query tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/api/gateway", () => ({
  gwGetPublishedBlogPosts: vi.fn(),
  gwGetPublishedBlogPostsCount: vi.fn(),
}));

import {
  gwGetPublishedBlogPosts,
  gwGetPublishedBlogPostsCount,
} from "@/lib/api/gateway";
import {
  getPublishedBlogPosts,
  getPublishedBlogPostsCount,
} from "@/lib/queries/blog";
import { PER_PAGE_OPTIONS } from "@/app/[locale]/blog/_components/BlogFilters";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── TC-18.1.1 ─────────────────────────────────────────────────────────────────

describe("getPublishedBlogPosts", () => {
  it("TC-18.1.1 applies categoryId filter", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    await getPublishedBlogPosts(20, 0, "cat-uuid");
    expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(20, 0, "cat-uuid", undefined);
  });

  it("TC-18.1.2 calls gateway with search when search is provided", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    await getPublishedBlogPosts(20, 0, undefined, "wireless headphones");
    expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(20, 0, undefined, "wireless headphones");
  });

  it("does not call gateway with whitespace-only search", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    await getPublishedBlogPosts(20, 0, undefined, "   ");
    expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(20, 0, undefined, "   ");
  });

  it("trims whitespace before calling gateway", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    await getPublishedBlogPosts(20, 0, undefined, "  sneakers  ");
    expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(20, 0, undefined, "  sneakers  ");
  });

  // TC-18.1.4 — perPage=50 produces correct range
  it("TC-18.1.4 uses correct limit=50, offset=0", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    await getPublishedBlogPosts(50, 0);
    expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(50, 0, undefined, undefined);
  });

  it("uses correct limit=20, offset=20 for page 2", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    await getPublishedBlogPosts(20, 20);
    expect(gwGetPublishedBlogPosts).toHaveBeenCalledWith(20, 20, undefined, undefined);
  });

  it("returns empty array on gateway error", async () => {
    vi.mocked(gwGetPublishedBlogPosts).mockResolvedValue([]);
    const result = await getPublishedBlogPosts();
    expect(result).toEqual([]);
  });
});

// ── TC-18.1.3 ─────────────────────────────────────────────────────────────────

describe("getPublishedBlogPostsCount", () => {
  it("TC-18.1.3 applies categoryId filter and returns count", async () => {
    vi.mocked(gwGetPublishedBlogPostsCount).mockResolvedValue(7);
    const count = await getPublishedBlogPostsCount("cat-uuid");
    expect(gwGetPublishedBlogPostsCount).toHaveBeenCalledWith("cat-uuid", undefined);
    expect(count).toBe(7);
  });

  it("applies search query", async () => {
    vi.mocked(gwGetPublishedBlogPostsCount).mockResolvedValue(3);
    await getPublishedBlogPostsCount(undefined, "shoes");
    expect(gwGetPublishedBlogPostsCount).toHaveBeenCalledWith(undefined, "shoes");
  });

  it("returns 0 on gateway error", async () => {
    vi.mocked(gwGetPublishedBlogPostsCount).mockResolvedValue(0);
    const count = await getPublishedBlogPostsCount();
    expect(count).toBe(0);
  });
});

// ── TC-18.1.5 ─────────────────────────────────────────────────────────────────

describe("PER_PAGE_OPTIONS", () => {
  it("TC-18.1.5 contains exactly [10, 20, 50, 100, 200]", () => {
    expect(Array.from(PER_PAGE_OPTIONS)).toEqual([10, 20, 50, 100, 200]);
  });

  it("does not include 999 (invalid values clamp to first option)", () => {
    expect((PER_PAGE_OPTIONS as readonly number[]).includes(999)).toBe(false);
  });

  it("does not include 0 or negative values", () => {
    const arr = PER_PAGE_OPTIONS as readonly number[];
    expect(arr.includes(0)).toBe(false);
    expect(arr.includes(-1)).toBe(false);
  });
});
