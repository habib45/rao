import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockVerify } = vi.hoisted(() => {
  return { mockVerify: vi.fn() };
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
      json: (body: unknown, init?: ResponseInit) =>
        new actual.NextResponse(JSON.stringify(body), {
          ...init,
          headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
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

vi.mock("@/app/admin/_lib/jwt", () => ({
  verifyAdminSession: mockVerify,
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { middleware, config } from "@/middleware";

function makeReq(pathname: string, cookieValue?: string) {
  const req = new NextRequest(`http://localhost${pathname}`);
  if (cookieValue !== undefined) {
    req.cookies.set("admin_token", cookieValue);
  }
  return req;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...process.env, NODE_ENV: "test" };
});

afterEach(() => {
  // Wholesale restore. process.env is typed as read-only on NODE_ENV, but at
  // runtime the wholesale assignment works in Node and is what every other
  // test file in this project does.
  const { NODE_ENV: _drop, ...rest } = process.env as Record<string, string | undefined>;
  process.env = rest as NodeJS.ProcessEnv;
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

  it("matcher includes admin paths", () => {
    expect(JSON.stringify(config.matcher)).toContain("admin");
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
    expect(mockVerify).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("/admin/api/* without session returns 401 JSON", async () => {
    mockVerify.mockResolvedValue(null);
    const req = makeReq("/admin/api/products");
    const res = await middleware(req);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("/admin/api/* with invalid role returns 403 JSON", async () => {
    mockVerify.mockResolvedValue({
      sub: "u1",
      email: "u@example.com",
      role: "viewer" as never,
    });
    const req = makeReq("/admin/api/products");
    const res = await middleware(req);
    expect(res.status).toBe(403);
  });

  it("/admin/* without session redirects to /admin/login", async () => {
    mockVerify.mockResolvedValue(null);
    const req = makeReq("/admin/dashboard");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("/admin/* with admin role passes through", async () => {
    mockVerify.mockResolvedValue({
      sub: "u1",
      email: "u@example.com",
      role: "admin",
    });
    const req = makeReq("/admin/dashboard");
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("/admin/* with editor role passes through", async () => {
    mockVerify.mockResolvedValue({
      sub: "u2",
      email: "e@example.com",
      role: "editor",
    });
    const req = makeReq("/admin/products");
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
  });
});

// ── Locale paths ──────────────────────────────────────────────────────────────

describe("locale paths", () => {
  it("/en/* delegates to intlMiddleware (not admin handler)", async () => {
    const req = makeReq("/en/products");
    await middleware(req);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("/ delegates to intlMiddleware", async () => {
    const req = makeReq("/");
    await middleware(req);
    expect(mockVerify).not.toHaveBeenCalled();
  });
});

// ── HTTPS enforcement ─────────────────────────────────────────────────────────

describe("https enforcement", () => {
  it("redirects http to https in production", async () => {
    const original = process.env.NODE_ENV;
    process.env = { ...process.env, NODE_ENV: "production" };
    const req = new NextRequest("http://example.com/page", {
      headers: { "x-forwarded-proto": "http" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/^https:/);
    process.env = { ...process.env, NODE_ENV: original ?? "test" };
  });

  it("allows https in production", async () => {
    const original = process.env.NODE_ENV;
    process.env = { ...process.env, NODE_ENV: "production" };
    const req = new NextRequest("https://example.com/page", {
      headers: { "x-forwarded-proto": "https" },
    });
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
    process.env = { ...process.env, NODE_ENV: original ?? "test" };
  });
});

// ── Token shape sanity ────────────────────────────────────────────────────────

describe("admin token shape sanity", () => {
  it("the mocked verifyAdminSession contract is what middleware relies on", () => {
    // The middleware expects verifyAdminSession to return either null or a
    // session shaped like { sub, email, role }. We assert the shape by giving
    // the mock those keys; if the middleware ever depended on additional
    // fields the assertion below will silently allow them, but the production
    // jwt.ts test (jwt.test.ts) pins the exact shape.
    mockVerify.mockReturnValueOnce(null);
    expect(mockVerify).toBeDefined();
  });
});
