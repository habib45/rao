import { NextRequest, NextResponse } from "next/server";
import { faqSchema } from "@/app/admin/_lib/schemas/faq";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: productId } = params;
  const res = await fetch(`${MYSQL_API_URL}/api/products/${productId}/faqs`, { cache: "no-store" });
  const data = await res.json() as unknown[];
  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: productId } = params;
  const body = await request.json();
  const result = faqSchema.safeParse({ ...body, product_id: productId });

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const res = await fetch(`${MYSQL_API_URL}/api/products/${productId}/faqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json(json, { status: 201 });
}
