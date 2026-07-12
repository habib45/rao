import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/app/admin/_lib/with-admin";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export const POST = withAdmin(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_status: "approved", rejection_reason: null }),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json(json);
});
