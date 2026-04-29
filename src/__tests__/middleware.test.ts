import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGetUser, mockCreateServerClient } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockCreateServerClient = vi.fn(() => ({
    auth: { getUser: mockGetUser },
  }));
  return { mockGetUser, mockCreateServerClient };
});

// Partial mock for next/server — replace NextResponse.next to avoid jsdom
// "request.headers must be an instance of Headers" validation in tests.
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: vi.fn(() => new actual.NextResponse(null, { status: 200 })),
      redirect: (url: URL | string) =>
        new actual.NextResponse(null, {
          status: 307,
          headers: { location: url.toString() },
        }),
    },
  };
});

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => vi.fn(() => ({ status: 200 }))),
}));

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "bn-BD", "sv"], defaultLocale: "en" },
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: mockCreateServerClient }));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { middleware, config } from "@/middleware";

function makeReq(pathname: string) {
  return new NextRequest(`http://localhost${pathname}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Config ────────────────────────────────────────────────────────────────────

describe("middleware config", () => {
  it("exports a middleware function", () => {
    expect(typeof middleware).toBe("function");
  });

  it("exports a matcher config", () => {
    expect(config.matcher).toBeDefined();
  });

  it("matcher excludes _next paths", () => {
    expect(JSON.stringify(config.matcher)).toContain("_next");
  });

  it("intlMiddleware factory is callable", () => {
    expect(createIntlMiddleware).toBeTypeOf("function");
  });
});

// ── Admin paths ───────────────────────────────────────────────────────────────

describe("admin paths", () => {
  it("/admin/login passes through without auth check", async () => {
    const req = makeReq("/admin/login");
    const res = await middleware(req);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("/admin/api/* passes through without session check", async () => {
    const req = makeReq("/admin/api/products");
    const res = await middleware(req);
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("/admin/* with no session redirects to /admin/login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = makeReq("/admin/dashboard");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("/admin/* with non-admin role redirects to /admin/login", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", app_metadata: { role: "editor" } } },
    });
    const req = makeReq("/admin/products");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("/admin/* with admin role passes through (status 200)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", app_metadata: { role: "admin" } } },
    });
    const req = makeReq("/admin/products");
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});

// ── Locale paths ──────────────────────────────────────────────────────────────

describe("locale paths", () => {
  it("/en/* delegates to intlMiddleware (not admin handler)", async () => {
    const req = makeReq("/en/products");
    await middleware(req);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("/ delegates to intlMiddleware", async () => {
    const req = makeReq("/");
    await middleware(req);
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
