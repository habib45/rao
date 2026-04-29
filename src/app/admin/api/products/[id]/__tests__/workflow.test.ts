import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function makeSupabaseStub(
  overrides: { data?: unknown; error?: { message: string } | null } = {}
) {
  const chain = {
    data: overrides.data ?? { id: "550e8400-e29b-41d4-a716-446655440000" },
    error: overrides.error ?? null,
  };

  const update = vi.fn().mockReturnThis();
  const eq = vi.fn().mockReturnThis();
  const select = vi.fn().mockReturnThis();
  const single = vi.fn().mockResolvedValue(chain);

  const stub = {
    from: vi.fn().mockReturnValue({ update, eq, select, single }),
    spies: { update, eq, select, single },
  };
  return stub;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST as approvePost } from "@/app/admin/api/products/[id]/approve/route";
import { POST as rejectPost } from "@/app/admin/api/products/[id]/reject/route";
import { POST as publishPost } from "@/app/admin/api/products/[id]/publish/route";

const PRODUCT_ID = "550e8400-e29b-41d4-a716-446655440000";

function makeRequest(method: string, path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  });
}

const params = Promise.resolve({ id: PRODUCT_ID });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /admin/api/products/[id]/approve", () => {
  it("returns 200 and updates product_status to approved", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest("POST", `/admin/api/products/${PRODUCT_ID}/approve`);
    const res = await approvePost(req, { params });
    expect(res.status).toBe(200);
    expect(stub.spies.update).toHaveBeenCalledWith({
      product_status: "approved",
      rejection_reason: null,
    });
    expect(stub.spies.eq).toHaveBeenCalledWith("id", PRODUCT_ID);
  });

  it("returns 500 when Supabase returns an error", async () => {
    const stub = makeSupabaseStub({
      data: null,
      error: { message: "DB error" },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest("POST", `/admin/api/products/${PRODUCT_ID}/approve`);
    const res = await approvePost(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("POST /admin/api/products/[id]/reject", () => {
  it("returns 200 and updates product_status to draft with reason", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest(
      "POST",
      `/admin/api/products/${PRODUCT_ID}/reject`,
      { reason: "Missing images" }
    );
    const res = await rejectPost(req, { params });
    expect(res.status).toBe(200);
    expect(stub.spies.update).toHaveBeenCalledWith({
      product_status: "draft",
      rejection_reason: "Missing images",
    });
  });

  it("treats an empty reason as null", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest(
      "POST",
      `/admin/api/products/${PRODUCT_ID}/reject`,
      { reason: "" }
    );
    const res = await rejectPost(req, { params });
    expect(res.status).toBe(200);
    expect(stub.spies.update).toHaveBeenCalledWith({
      product_status: "draft",
      rejection_reason: null,
    });
  });

  it("returns 500 when Supabase returns an error", async () => {
    const stub = makeSupabaseStub({
      data: null,
      error: { message: "DB error" },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest(
      "POST",
      `/admin/api/products/${PRODUCT_ID}/reject`,
      { reason: "x" }
    );
    const res = await rejectPost(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("POST /admin/api/products/[id]/publish", () => {
  it("returns 200 and updates product to published+active and clears publish_at", async () => {
    const stub = makeSupabaseStub();
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest("POST", `/admin/api/products/${PRODUCT_ID}/publish`);
    const res = await publishPost(req, { params });
    expect(res.status).toBe(200);
    expect(stub.spies.update).toHaveBeenCalledWith({
      product_status: "published",
      is_active: true,
      publish_at: null,
    });
    expect(stub.spies.eq).toHaveBeenCalledWith("id", PRODUCT_ID);
  });

  it("returns 500 when Supabase returns an error", async () => {
    const stub = makeSupabaseStub({
      data: null,
      error: { message: "DB error" },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      stub as unknown as ReturnType<typeof createAdminClient>
    );

    const req = makeRequest("POST", `/admin/api/products/${PRODUCT_ID}/publish`);
    const res = await publishPost(req, { params });
    expect(res.status).toBe(500);
  });
});
