// F18.3 — Admin blog comments API route tests (TC-18.3.1 – 18.3.5)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Supabase stub ─────────────────────────────────────────────────────────────

function makeSupabaseStub(
  overrides: {
    data?: unknown;
    count?: number | null;
    error?: { message: string } | null;
  } = {},
) {
  const chain = {
    data: overrides.data ?? null,
    count: overrides.count ?? null,
    error: overrides.error ?? null,
  };
  const stub: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then(
      resolve: (v: typeof chain) => unknown,
      reject?: (e: unknown) => unknown,
    ) {
      return Promise.resolve(chain).then(resolve, reject);
    },
  };
  return stub;
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/app/admin/_lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-1",
    email: "admin@example.com",
    app_metadata: { role: "admin" },
  }),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "@/app/admin/api/blog/comments/route";
import {
  PATCH,
  DELETE,
} from "@/app/admin/api/blog/comments/[id]/route";

const COMMENT_ID = "c-550e8400-e29b-41d4-a716-446655440001";
const params = Promise.resolve({ id: COMMENT_ID });

function makeGETRequest(query: Record<string, string> = {}) {
  const url = new URL("http://localhost/admin/api/blog/comments");
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePatchRequest(body: unknown) {
  return new NextRequest(
    `http://localhost/admin/api/blog/comments/${COMMENT_ID}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET (list) ────────────────────────────────────────────────────────────────

describe("GET /admin/api/blog/comments", () => {
  it("returns 200 with data and total", async () => {
    const comments = [{ id: COMMENT_ID, is_approved: false }];
    const stub = makeSupabaseStub({ data: comments, count: 1 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await GET(makeGETRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.data).toHaveLength(1);
  });

  it("TC-18.3.1 applies is_approved=false filter for status=pending", async () => {
    const stub = makeSupabaseStub({ data: [], count: 0 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await GET(makeGETRequest({ status: "pending" }));

    expect(stub.eq).toHaveBeenCalledWith("is_approved", false);
  });

  it("TC-18.3.2 applies is_approved=true filter for status=approved", async () => {
    const stub = makeSupabaseStub({ data: [], count: 0 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await GET(makeGETRequest({ status: "approved" }));

    expect(stub.eq).toHaveBeenCalledWith("is_approved", true);
  });

  it("does not apply is_approved filter for status=all", async () => {
    const stub = makeSupabaseStub({ data: [], count: 0 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await GET(makeGETRequest({ status: "all" }));

    const eqCalls = (stub.eq as ReturnType<typeof vi.fn>).mock.calls;
    const approvedCalls = eqCalls.filter((c) => c[0] === "is_approved");
    expect(approvedCalls).toHaveLength(0);
  });

  it("applies postId filter when provided", async () => {
    const stub = makeSupabaseStub({ data: [], count: 0 });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    await GET(makeGETRequest({ postId: "post-uuid" }));

    expect(stub.eq).toHaveBeenCalledWith("blog_post_id", "post-uuid");
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "DB error" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await GET(makeGETRequest());
    expect(res.status).toBe(500);
  });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe("PATCH /admin/api/blog/comments/[id]", () => {
  it("TC-18.3.3 returns 200 and updates is_approved=true", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(makePatchRequest({ is_approved: true }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(stub.update).toHaveBeenCalledWith({ is_approved: true });
  });

  it("TC-18.3.4 returns 400 for invalid body (missing is_approved)", async () => {
    const res = await PATCH(makePatchRequest({ invalid: "field" }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest(
      `http://localhost/admin/api/blog/comments/${COMMENT_ID}`,
      { method: "PATCH", body: "not-json" },
    );
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 200 for is_approved=false (hide)", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(makePatchRequest({ is_approved: false }), { params });
    expect(res.status).toBe(200);
    expect(stub.update).toHaveBeenCalledWith({ is_approved: false });
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "update failed" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await PATCH(makePatchRequest({ is_approved: true }), { params });
    expect(res.status).toBe(500);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe("DELETE /admin/api/blog/comments/[id]", () => {
  it("TC-18.3.5 returns 200 and deletes the comment", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const req = new NextRequest(
      `http://localhost/admin/api/blog/comments/${COMMENT_ID}`,
      { method: "DELETE" },
    );
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(stub.delete).toHaveBeenCalled();
    expect(stub.eq).toHaveBeenCalledWith("id", COMMENT_ID);
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ error: { message: "delete failed" } });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>,
    );

    const req = new NextRequest(
      `http://localhost/admin/api/blog/comments/${COMMENT_ID}`,
      { method: "DELETE" },
    );
    const res = await DELETE(req, { params });
    expect(res.status).toBe(500);
  });
});
