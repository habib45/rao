import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "server-only";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function getAdminUser() {
  if (DATA_SOURCE === "mysql") {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;

    try {
      const res = await fetch(`${MYSQL_API_URL}/api/auth/me`, {
        headers: { Cookie: `admin_token=${token}` },
        cache: "no-store",
      });
      if (!res.ok) return null;
      return res.json() as Promise<{
        id: string;
        email: string;
        role: string;
        name: string;
      }>;
    } catch {
      return null;
    }
  }

  // Supabase path
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components — cookies are read-only
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}
