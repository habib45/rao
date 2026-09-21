import { NextRequest, NextResponse } from "next/server";
import { categorySchema } from "@/app/admin/_lib/schemas/category";
import { withAdmin, EDITOR_OR_ADMIN } from "@/app/admin/_lib/with-admin";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export const GET = withAdmin(async () => {
  const res = await fetch(`${MYSQL_API_URL}/api/categories`, { cache: "no-store" });
  const data = await res.json() as unknown[];
  return NextResponse.json(data);
}, EDITOR_OR_ADMIN);

export const POST = withAdmin(async (request: NextRequest) => {
  const body = await request.json();
  const result = categorySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const res = await fetch(`${MYSQL_API_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
  });
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
  return NextResponse.json(json, { status: 201 });
});
