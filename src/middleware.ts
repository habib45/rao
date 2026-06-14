import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith("/admin/api/")) return NextResponse.next();

  const token = request.cookies.get("admin_token")?.value;
  if (!token || token !== "authenticated") {
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

  // Canonical WWW/non-WWW redirect (optional - uncomment if needed)
  // const hostname = request.headers.get("host");
  // if (hostname?.startsWith("www.")) {
  //   const url = request.nextUrl.clone();
  //   url.hostname = hostname.replace(/^www\./, "");
  //   return NextResponse.redirect(url);
  // }

  if (pathname.startsWith("/admin")) return handleAdminAuth(request);
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
