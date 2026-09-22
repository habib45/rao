// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT } from "jose";

const TEST_SECRET = "unit-test-secret-please-ignore";
const REAL_ENV = { ...process.env };

/**
 * jsdom's polyfilled TextEncoder returns a Uint8Array from a different
 * realm, so `instanceof Uint8Array` is false (jose checks). Use
 * Uint8Array.from for a real byte array.
 */
function toBytes(s: string): Uint8Array {
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function importFresh() {
  // Re-import module after mutating env so the lazy boot-guard re-evaluates.
  vi.resetModules();
  return await import("@/app/admin/_lib/jwt");
}

function setEnv(overrides: Record<string, string | undefined>) {
  // Replace the env object wholesale to avoid NODE_ENV read-only errors.
  process.env = { ...REAL_ENV, ...overrides };
}

beforeEach(() => {
  setEnv({ NODE_ENV: "test", ADMIN_JWT_SECRET: TEST_SECRET });
});

afterEach(() => {
  process.env = REAL_ENV;
});

describe("signAdminSession / verifyAdminSession", () => {
  it("round-trips a valid admin session", async () => {
    const { signAdminSession, verifyAdminSession } = await importFresh();
    const token = await signAdminSession({
      sub: "user-1",
      email: "a@b.c",
      role: "admin",
      name: "Ada",
    });
    const session = await verifyAdminSession(token);
    expect(session).not.toBeNull();
    expect(session).toMatchObject({
      sub: "user-1",
      email: "a@b.c",
      role: "admin",
      name: "Ada",
    });
  });

  it("returns null for an invalid token", async () => {
    const { verifyAdminSession } = await importFresh();
    expect(await verifyAdminSession("not-a-jwt")).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const otherSecret = toBytes("another-secret");
    const otherToken = await new SignJWT({
      email: "a@b.c",
      role: "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("orh-admin")
      .setAudience("orh-admin")
      .sign(otherSecret);

    const mod = await importFresh();
    expect(await mod.verifyAdminSession(otherToken)).toBeNull();
  });

  it("returns null when the role is not admin/editor", async () => {
    const secret = toBytes(TEST_SECRET);
    const token = await new SignJWT({ email: "a@b.c", role: "viewer" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("orh-admin")
      .setAudience("orh-admin")
      .sign(secret);

    const mod = await importFresh();
    expect(await mod.verifyAdminSession(token)).toBeNull();
  });

  it("returns null for an expired token", async () => {
    const secret = toBytes(TEST_SECRET);
    const token = await new SignJWT({ email: "a@b.c", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuedAt()
      .setExpirationTime("-1s")
      .setIssuer("orh-admin")
      .setAudience("orh-admin")
      .sign(secret);

    const mod = await importFresh();
    expect(await mod.verifyAdminSession(token)).toBeNull();
  });

  it("returns null when the token has a wrong issuer", async () => {
    const secret = toBytes(TEST_SECRET);
    const token = await new SignJWT({ email: "a@b.c", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("evil-issuer")
      .setAudience("orh-admin")
      .sign(secret);

    const mod = await importFresh();
    expect(await mod.verifyAdminSession(token)).toBeNull();
  });
});

describe("boot guard", () => {
  it("throws in production when ADMIN_JWT_SECRET is missing", async () => {
    setEnv({ NODE_ENV: "production", ADMIN_JWT_SECRET: undefined });
    const { signAdminSession } = await importFresh();
    await expect(
      signAdminSession({ sub: "u1", email: "a@b.c", role: "admin" }),
    ).rejects.toThrow(/ADMIN_JWT_SECRET/);
  });

  it("throws in production when ADMIN_JWT_SECRET equals dev fallback", async () => {
    setEnv({
      NODE_ENV: "production",
      ADMIN_JWT_SECRET: "dev-only-not-for-production",
    });
    const { signAdminSession } = await importFresh();
    await expect(
      signAdminSession({ sub: "u1", email: "a@b.c", role: "admin" }),
    ).rejects.toThrow(/development fallback/);
  });

  it("throws in production when ADMIN_JWT_SECRET is empty string", async () => {
    setEnv({ NODE_ENV: "production", ADMIN_JWT_SECRET: "" });
    const { signAdminSession } = await importFresh();
    await expect(
      signAdminSession({ sub: "u1", email: "a@b.c", role: "admin" }),
    ).rejects.toThrow(/ADMIN_JWT_SECRET/);
  });
});

describe("adminSessionCookieAttributes", () => {
  it("sets httpOnly and sameSite=lax always", async () => {
    const { adminSessionCookieAttributes } = await importFresh();
    const attrs = adminSessionCookieAttributes(3600);
    expect(attrs.httpOnly).toBe(true);
    expect(attrs.sameSite).toBe("lax");
    expect(attrs.path).toBe("/");
    expect(attrs.maxAge).toBe(3600);
  });

  it("sets secure in production", async () => {
    setEnv({ NODE_ENV: "production" });
    const { adminSessionCookieAttributes } = await importFresh();
    expect(adminSessionCookieAttributes(60).secure).toBe(true);
  });

  it("does not set secure outside production", async () => {
    setEnv({ NODE_ENV: "development" });
    const { adminSessionCookieAttributes } = await importFresh();
    expect(adminSessionCookieAttributes(60).secure).toBe(false);
  });
});