import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/app/admin/_lib/with-admin";

export const POST = withAdmin(async () => {
  revalidatePath("/sitemap.xml", "page");
  return NextResponse.json({ revalidated: true });
});
