// F18.1 — Blog pagination & filtering query tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Separate the query chain (thenable) from the client stub so that
// Promise.resolve(clientStub) doesn't accidentally unwrap via stub.then().
function makeChain(
  overrides: {
    data?: unknown;
    count?: number | null;
    error?: { message: string } | null;
  } = {},
) {
  const result = {
    data: overrides.data ?? [],
    count: overrides.count ?? null,
    error: overrides.error ?? null,
  };

  const queryChain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then(
      resolve: (v: typeof result) => unknown,
      reject?: (e: unknown) => unknown,
    ) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };

  // clientStub has no `then` — safe to use with mockResolvedValue
  const clientStub = {
    from: vi.fn().mockReturnValue(queryChain),
  };

  return { clientStub, queryChain };
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn() }));

import { createServerClient } from "@/lib/supabase/server";
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
  it("TC-18.1.1 applies categoryId eq filter", async () => {
    const { clientStub, queryChain } = makeChain({ data: [] });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPosts(20, 0, "cat-uuid");

    expect(queryChain.eq).toHaveBeenCalledWith("blog_category_id", "cat-uuid");
  });

  it("TC-18.1.2 calls textSearch when search is provided", async () => {
    const { clientStub, queryChain } = makeChain({ data: [] });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPosts(20, 0, undefined, "wireless headphones");

    expect(queryChain.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "wireless headphones",
      { type: "websearch", config: "english" },
    );
  });

  it("does not call textSearch for whitespace-only search", async () => {
    const { clientStub, queryChain } = makeChain({ data: [] });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPosts(20, 0, undefined, "   ");

    expect(queryChain.textSearch).not.toHaveBeenCalled();
  });

  it("trims whitespace before calling textSearch", async () => {
    const { clientStub, queryChain } = makeChain({ data: [] });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPosts(20, 0, undefined, "  sneakers  ");

    expect(queryChain.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "sneakers",
      expect.objectContaining({ type: "websearch" }),
    );
  });

  // TC-18.1.4 — perPage=50 produces correct range
  it("TC-18.1.4 uses correct range for limit=50, offset=0", async () => {
    const { clientStub, queryChain } = makeChain({ data: [] });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPosts(50, 0);

    expect(queryChain.range).toHaveBeenCalledWith(0, 49);
  });

  it("uses correct range for page 2 with limit=20 (offset=20)", async () => {
    const { clientStub, queryChain } = makeChain({ data: [] });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPosts(20, 20);

    expect(queryChain.range).toHaveBeenCalledWith(20, 39);
  });

  it("returns empty array on Supabase error", async () => {
    const { clientStub } = makeChain({ data: null, error: { message: "DB error" } });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    const result = await getPublishedBlogPosts();
    expect(result).toEqual([]);
  });
});

// ── TC-18.1.3 ─────────────────────────────────────────────────────────────────

describe("getPublishedBlogPostsCount", () => {
  it("TC-18.1.3 applies categoryId filter and returns count", async () => {
    const { clientStub, queryChain } = makeChain({ count: 7 });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    const count = await getPublishedBlogPostsCount("cat-uuid");

    expect(queryChain.eq).toHaveBeenCalledWith("blog_category_id", "cat-uuid");
    expect(count).toBe(7);
  });

  it("applies textSearch for search query", async () => {
    const { clientStub, queryChain } = makeChain({ count: 3 });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

    await getPublishedBlogPostsCount(undefined, "shoes");

    expect(queryChain.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "shoes",
      { type: "websearch", config: "english" },
    );
  });

  it("returns 0 on Supabase error", async () => {
    const { clientStub } = makeChain({ count: null, error: { message: "DB error" } });
    vi.mocked(createServerClient).mockResolvedValue(
      clientStub as unknown as Awaited<ReturnType<typeof createServerClient>>,
    );

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
