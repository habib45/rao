import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { blogPostInputSchema } from "@/app/admin/_lib/schemas/blog";
import { syncPostTags } from "@/app/admin/_lib/blog-tags";

const BLOG_SELECT = `
  *,
  blog_categories(id, name, slug, color),
  blog_post_tags(blog_tags(id, name, slug))
`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = blogPostInputSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { tag_names, ...rest } = parsed.data;
  const updatePayload: Record<string, unknown> = { ...rest };

  // If transitioning to published and published_at is not set, set it now.
  if (rest.status === "published") {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();

    const existingPublishedAt = (
      existing as { published_at: string | null } | null
    )?.published_at;

    if (!existingPublishedAt && rest.published_at === undefined) {
      updatePayload.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updatePayload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    console.error("[admin/blog PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tag_names !== undefined) {
    await syncPostTags(id, tag_names);
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

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
