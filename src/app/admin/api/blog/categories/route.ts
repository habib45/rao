import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { blogCategoryInputSchema } from "@/app/admin/_lib/schemas/blog";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET() {
  await requireAdmin();
  const res = await fetch(`${MYSQL_API_URL}/api/blog/categories`, { cache: "no-store" });
  const json = await res.json() as { data?: unknown[] };
  return NextResponse.json({ categories: json.data ?? [] });
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

  const res = await fetch(`${MYSQL_API_URL}/api/blog/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  const json = await res.json() as { id?: string; error?: string };
  if (!res.ok) return NextResponse.json({ error: json.error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json({ id: json.id }, { status: 201 });
}
