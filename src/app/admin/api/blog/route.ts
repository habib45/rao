import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { blogPostInputSchema } from "@/app/admin/_lib/schemas/blog";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

const BLOG_SELECT = `
  *,
  blog_categories(id, name, slug, color),
  blog_post_tags(blog_tags(id, name, slug))
`;

export async function GET() {
  await requireAdmin();

  const res = await fetch(`${MYSQL_API_URL}/api/blog/posts?limit=200`, { cache: "no-store" });
  const json = await res.json() as { data: unknown[] };
  return NextResponse.json({ posts: json.data ?? [] });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json().catch(() => null);
  const parsed = blogPostInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tag_names, published_at, ...rest } = parsed.data;
  const insertPayload: Record<string, unknown> = { ...rest };

  if (rest.status === "published") {
    insertPayload.published_at = published_at ?? new Date().toISOString();
  } else if (published_at !== undefined) {
    insertPayload.published_at = published_at;
  }

  const tags = tag_names ?? [];
  const res = await fetch(`${MYSQL_API_URL}/api/blog/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...insertPayload, tags }),
  });
  const json = await res.json() as { id?: string; error?: string };
  if (!res.ok) return NextResponse.json({ error: json.error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json({ id: json.id }, { status: 201 });
}
