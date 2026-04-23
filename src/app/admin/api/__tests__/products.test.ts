import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function makeSupabaseStub(overrides: { data?: unknown; error?: { message: string } | null } = {}) {
  const chain = {
    data: overrides.data ?? null,
    error: overrides.error ?? null,
    count: null,
  };

  const stub: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(chain),
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
import { PATCH, DELETE } from "@/app/admin/api/products/[id]/route";

function makeRequest(method: string, body?: unknown, id = "550e8400-e29b-41d4-a716-446655440000") {
  return new NextRequest(`http://localhost/admin/api/products/${id}`, {
    method,
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  });
}

const validProduct = {
  name: { en: "Laptop" },
  slug: { en: "laptop" },
  description: { en: "A great laptop" },
  meta_title: { en: "Laptop" },
  meta_description: { en: "Buy laptop" },
  features: [],
  price_cents: 99999,
  original_price_cents: null,
  currency: "USD",
  discount_pct: 0,
  category_id: null,
  brand: null,
  availability: "in_stock",
  is_featured: false,
  is_active: true,
};

const params = Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /admin/api/products/[id]", () => {
  it("returns 200 with valid partial body", async () => {
    const stub = makeSupabaseStub({ data: { id: "550e8400-e29b-41d4-a716-446655440000" } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("PATCH", { is_active: false });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it("returns 400 when name.en is empty", async () => {
    const req = makeRequest("PATCH", { ...validProduct, name: { en: "" } });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when availability is invalid", async () => {
    const req = makeRequest("PATCH", { ...validProduct, availability: "not_valid" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 when discount_pct exceeds 100", async () => {
    const req = makeRequest("PATCH", { ...validProduct, discount_pct: 150 });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 500 when Supabase returns an error", async () => {
    const stub = makeSupabaseStub({ data: null, error: { message: "DB error" } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("PATCH", { is_active: true });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /admin/api/products/[id]", () => {
  it("soft-deletes and returns ok:true", async () => {
    const stub = makeSupabaseStub({ data: null, error: null });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("DELETE");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect((stub.update as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ is_active: false });
  });

  it("returns 500 when Supabase returns an error", async () => {
    const stub = makeSupabaseStub({ data: null, error: { message: "DB error" } });
    vi.mocked(createAdminClient).mockReturnValue(stub as unknown as ReturnType<typeof createAdminClient>);

    const req = makeRequest("DELETE");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(500);
  });
});
