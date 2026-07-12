import { NextRequest, NextResponse } from "next/server";
import { faqUpdateSchema } from "@/app/admin/_lib/schemas/faq";
import { withAdmin } from "@/app/admin/_lib/with-admin";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export const PATCH = withAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) => {
  const { id: productId, faqId } = await params;
  const body = await request.json();
  const result = faqUpdateSchema.safeParse({ ...body, id: faqId });

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const res = await fetch(`${MYSQL_API_URL}/api/products/${productId}/faqs/${faqId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json(json);
});

export const DELETE = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) => {
  const { id: productId, faqId } = await params;
  const res = await fetch(`${MYSQL_API_URL}/api/products/${productId}/faqs/${faqId}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json(json);
});
