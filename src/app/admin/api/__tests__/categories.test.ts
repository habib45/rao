import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Thenable Supabase stub ────────────────────────────────────────────────────

function makeSupabaseStub(overrides: { data?: unknown; error?: { message: string } | null } = {}) {
  const chain = {
    data: overrides.data ?? null,
    error: overrides.error ?? null,
    count: null,
  };

  const stub: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(chain),
    // Make the stub itself awaitable (thenable)
    then(resolve: (v: typeof chain) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(chain).then(resolve, reject);
    },
  };
  return stub;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { GET, POST } from "@/app/admin/api/categories/route";
import { PATCH, DELETE } from "@/app/admin/api/categories/[id]/route";

function makeRequest(method: string, body?: unknown, url = "http://localhost/admin/api/categories") {
  return new NextRequest(url, {
    method,
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  });
}

const validCategory = {
  name: { en: "Electronics" },
  slug: { en: "electronics" },
  description: { en: "All electronics" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /admin/api/categories", () => {
  it("returns 200 with category list", async () => {
    const stub = makeSupabaseStub({ data: [] });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("returns 500 on Supabase error", async () => {
    const stub = makeSupabaseStub({ data: null, error: { message: "DB error" } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("POST /admin/api/categories", () => {
  it("returns 201 with valid body", async () => {
    const stub = makeSupabaseStub({ data: { id: "new-id", ...validCategory } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("POST", validCategory);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("returns 400 when name.en is missing", async () => {
    const req = makeRequest("POST", {
      name: { "bn-BD": "test" },
      slug: { en: "test" },
      description: { en: "test" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when parent_id is not a UUID", async () => {
    const req = makeRequest("POST", { ...validCategory, parent_id: "not-a-uuid" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("transforms empty image_url to null before insert", async () => {
    const stub = makeSupabaseStub({ data: { id: "new-id", ...validCategory, image_url: null } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("POST", { ...validCategory, image_url: "" });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const insertArg = (stub.insert as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(insertArg?.image_url).toBeNull();
  });
});

describe("PATCH /admin/api/categories/[id]", () => {
  const params = Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" });

  it("returns 200 with a partial valid body", async () => {
    const stub = makeSupabaseStub({ data: { id: "550e8400-e29b-41d4-a716-446655440000" } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("PATCH", { name: { en: "Updated" } }, "http://localhost/admin/api/categories/550e8400-e29b-41d4-a716-446655440000");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it("returns 400 when parent_id is invalid", async () => {
    const req = makeRequest("PATCH", { parent_id: "bad-id" }, "http://localhost/admin/api/categories/550e8400-e29b-41d4-a716-446655440000");
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /admin/api/categories/[id]", () => {
  const params = Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" });

  it("soft-deletes and returns ok:true", async () => {
    const stub = makeSupabaseStub({ data: null, error: null });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("DELETE", undefined, "http://localhost/admin/api/categories/550e8400-e29b-41d4-a716-446655440000");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(stub.update).toBeTypeOf("function");
    expect((stub.update as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ is_active: false });
  });
});
