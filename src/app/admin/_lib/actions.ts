"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (token) {
    await fetch(`${MYSQL_API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `admin_token=${token}` },
    });
  }

  cookieStore.delete("admin_token");
  redirect("/admin/login");
}
