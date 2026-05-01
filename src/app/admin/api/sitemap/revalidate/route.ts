import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/admin/_lib/auth";

export async function POST() {
  await requireAdmin();
  revalidatePath("/sitemap.xml", "page");
  return NextResponse.json({ revalidated: true });
}
