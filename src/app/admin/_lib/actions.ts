"use server";

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function signOut() {
  if (DATA_SOURCE === "mysql") {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (token) {
      await fetch(`${MYSQL_API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Cookie: `admin_token=${token}` },
      }).catch(() => {});
    }

    cookieStore.delete("admin_token");
    redirect("/admin/login");
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

  await supabase.auth.signOut();
  redirect("/admin/login");
}
