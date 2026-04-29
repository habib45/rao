import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { blogCategoryInputSchema } from "@/app/admin/_lib/schemas/blog";

export async function GET() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[admin/blog/categories GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  const parsed = blogCategoryInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) {
    console.error("[admin/blog/categories POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
