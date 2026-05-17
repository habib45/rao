import { NextRequest, NextResponse } from "next/server";
import { categorySchema } from "@/app/admin/_lib/schemas/category";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/categories/${id}`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await res.json());
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = categorySchema.partial().safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const res = await fetch(`${MYSQL_API_URL}/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json(json);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/categories/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
