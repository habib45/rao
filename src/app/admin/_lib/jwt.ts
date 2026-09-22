/**
 * Admin session JWT helpers.
 *
 * Why `jose`?
 *   - Pure JS, edge-compatible (Next.js middleware runs on the edge).
 *   - HS256 with no native build step.
 *
 * Security:
 *   - HS256 with a server-only secret (ADMIN_JWT_SECRET).
 *   - Default expiry 1 hour; signed and verified on every admin request.
 *   - Boot guard: throws if NODE_ENV === "production" and ADMIN_JWT_SECRET is
 *     unset or matches the dev fallback. We never silently mint tokens with a
 *     default secret in prod.
 */

import { SignJWT, jwtVerify } from "jose";

export type AdminRole = "admin" | "editor";

export interface AdminSession {
  sub: string; // user id
  email: string;
  role: AdminRole;
  name?: string;
}

const DEFAULT_EXPIRES_IN = "1h";
const DEV_FALLBACK_SECRET = "dev-only-not-for-production";

function getSecretKey(): Uint8Array {
  const raw = process.env.ADMIN_JWT_SECRET;

  if (!raw || raw.length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_JWT_SECRET is not set. Refusing to start in production without a signed-secret.",
      );
    }
    // Dev fallback — must NEVER be used to authenticate in production.
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }

  if (raw === DEV_FALLBACK_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_JWT_SECRET is set to the development fallback. Configure a real secret for production.",
    );
  }

  return new TextEncoder().encode(raw);
}

export async function signAdminSession(
  payload: AdminSession,
  options: { expiresIn?: string } = {},
): Promise<string> {
  const expiresIn = options.expiresIn ?? DEFAULT_EXPIRES_IN;
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer("orh-admin")
    .setAudience("orh-admin")
    .sign(getSecretKey());
}

export async function verifyAdminSession(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "orh-admin",
      audience: "orh-admin",
      algorithms: ["HS256"],
    });
    const { sub, email, role, name } = payload as Record<string, unknown>;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    if (role !== "admin" && role !== "editor") return null;
    return {
      sub,
      email,
      role,
      name: typeof name === "string" ? name : undefined,
    };
  } catch {
    // Signature expired, invalid, wrong issuer/audience, or other JWS error.
    return null;
  }
}

/**
 * Cookie attributes for the admin session token.
 * - httpOnly: blocks JS access (defence in depth against XSS).
 * - secure in production: requires HTTPS.
 * - sameSite=lax: blocks cross-site POSTs from triggering admin mutations.
 * - path=/: sent on every route under the app domain.
 */
export function adminSessionCookieAttributes(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
