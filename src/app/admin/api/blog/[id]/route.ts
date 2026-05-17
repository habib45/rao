import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { blogPostInputSchema } from "@/app/admin/_lib/schemas/blog";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const res = await fetch(`${MYSQL_API_URL}/api/blog/posts/${id}`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await res.json());
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

  const { tag_names, ...rest } = parsed.data;
  const updatePayload: Record<string, unknown> = { ...rest };

  const res = await fetch(`${MYSQL_API_URL}/api/blog/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...updatePayload, tags: tag_names }),
  });
  const json = await res.json() as { error?: string };
  if (!res.ok) return NextResponse.json({ error: json.error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json({ id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const res = await fetch(`${MYSQL_API_URL}/api/blog/posts/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
