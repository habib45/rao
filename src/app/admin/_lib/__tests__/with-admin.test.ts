import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const REAL_ENV = { ...process.env };

const { mockGetAdminUser } = vi.hoisted(() => {
  return { mockGetAdminUser: vi.fn() };
});

vi.mock("@/app/admin/_lib/auth", () => ({
  getAdminUser: mockGetAdminUser,
}));

beforeEach(async () => {
  vi.clearAllMocks();
  process.env = { ...REAL_ENV };
  process.env.ADMIN_JWT_SECRET = "unit-test-secret";
  vi.resetModules();
  vi.doMock("@/app/admin/_lib/auth", () => ({
    getAdminUser: mockGetAdminUser,
  }));
});

afterEach(() => {
  process.env = REAL_ENV;
});

async function importWithAdmin() {
  const mod = await import("@/app/admin/_lib/with-admin");
  return mod.withAdmin;
}

function makeReq() {
  return new NextRequest("http://localhost/admin/api/products");
}

describe("withAdmin", () => {
  it("calls the handler with the verified session when authenticated", async () => {
    const session = {
      sub: "u1",
      email: "a@b.c",
      role: "admin" as const,
    };
    mockGetAdminUser.mockResolvedValue(session);
    const withAdmin = await importWithAdmin();

    const handler = vi.fn().mockResolvedValue(
      new NextResponse(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const res = await withAdmin(handler)(makeReq(), { params: {} });

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ params: {} }),
      session,
    );
  });

  it("returns 401 envelope when session is missing", async () => {
    mockGetAdminUser.mockResolvedValue(null);
    const withAdmin = await importWithAdmin();

    const handler = vi.fn();
    const res = await withAdmin(handler)(makeReq(), { params: {} });

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 403 envelope when role is wrong (single string)", async () => {
    mockGetAdminUser.mockResolvedValue({
      sub: "u1",
      email: "a@b.c",
      role: "editor",
    });
    const withAdmin = await importWithAdmin();

    const handler = vi.fn();
    const res = await withAdmin(handler, { role: "admin" })(
      makeReq(),
      { params: {} },
    );

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("accepts an array of roles", async () => {
    mockGetAdminUser.mockResolvedValue({
      sub: "u1",
      email: "a@b.c",
      role: "editor",
    });
    const withAdmin = await importWithAdmin();

    const handler = vi.fn().mockResolvedValue(new NextResponse(null, { status: 200 }));
    const res = await withAdmin(handler, { role: ["admin", "editor"] })(
      makeReq(),
      { params: {} },
    );

    expect(handler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("rejects roles not in the allowed array", async () => {
    mockGetAdminUser.mockResolvedValue({
      sub: "u1",
      email: "a@b.c",
      role: "editor",
    });
    const withAdmin = await importWithAdmin();

    const handler = vi.fn();
    const res = await withAdmin(handler, { role: ["admin"] })(
      makeReq(),
      { params: {} },
    );

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
  });

  it("forwards typed params to the handler", async () => {
    mockGetAdminUser.mockResolvedValue({
      sub: "u1",
      email: "a@b.c",
      role: "admin",
    });
    const withAdmin = await importWithAdmin();

    const handler = vi.fn().mockResolvedValue(new NextResponse(null, { status: 200 }));
    const ctx = { params: { id: "42" } };

    await withAdmin<{ id: string }>(handler)(makeReq(), ctx);

    expect(handler).toHaveBeenCalledWith(expect.anything(), ctx, expect.anything());
  });
});