"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (token) {
    // Forward the *signed* JWT (no longer the literal "authenticated" string)
    // so the gateway can match it against its own session store.
    await fetch(`${MYSQL_API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `admin_token=${token}` },
    }).catch(() => {
      // Best-effort: even if the gateway call fails, we still clear the
      // local session and redirect.
    });
  }

  cookieStore.delete("admin_token");
  redirect("/admin/login");
}
