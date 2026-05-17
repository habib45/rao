import { NextRequest, NextResponse } from "next/server";
import { productUpdateSchema } from "@/app/admin/_lib/schemas/product";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await res.json());
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = productUpdateSchema.partial().safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const updateData = { ...result.data } as Record<string, unknown>;
  const images = Array.isArray(updateData.images)
    ? (updateData.images as { url: string; width?: number; height?: number; is_primary?: boolean; sort_order?: number }[])
    : undefined;
  delete updateData.images;

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });

  if (images !== undefined) {
    await fetch(`${MYSQL_API_URL}/api/products/${id}/images`, { method: "DELETE" });
    for (const img of images) {
      await fetch(`${MYSQL_API_URL}/api/products/${id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(img),
      });
    }
  }
  return NextResponse.json(json);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
