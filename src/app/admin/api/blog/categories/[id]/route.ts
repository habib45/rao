import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { blogCategoryInputSchema } from "@/app/admin/_lib/schemas/blog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = blogCategoryInputSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    console.error("[admin/blog/categories PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("blog_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/blog/categories DELETE]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
