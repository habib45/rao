import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAdmin, EDITOR_OR_ADMIN } from "@/app/admin/_lib/with-admin";

export const POST = withAdmin(async () => {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ ok: true });
}, EDITOR_OR_ADMIN);
