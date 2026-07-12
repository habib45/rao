import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { verifyAdminSession } from "@/app/admin/_lib/jwt";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Edge-friendly admin gate. Verifies the signed JWT issued at /admin/api/auth/login
 * and lets only `admin` and `editor` roles through. Pages stay HTML, API routes
 * get a 401 JSON response (handled by withAdmin() too — defence in depth).
 */
async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Public entry points. The login page and login API route must be reachable
  // without an existing session, otherwise no one can ever log in.
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/api/auth/login" ||
    pathname === "/admin/api/auth/logout"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_token")?.value;
  const session = await verifyAdminSession(token);

  if (!session) {
    // API routes get a 401 JSON body so clients can react without parsing HTML.
    if (pathname.startsWith("/admin/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (session.role !== "admin" && session.role !== "editor") {
    if (pathname.startsWith("/admin/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // HTTPS enforcement (only in production)
  if (process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-proto") !== "https") {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) return handleAdminAuth(request);
  return intlMiddleware(request);
}

export const config = {
  // Run on every path *except* public Next assets and non-admin api routes.
  // /admin/* must match so the JWT gate fires before route handlers.
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/admin/:path*",
  ],
};
