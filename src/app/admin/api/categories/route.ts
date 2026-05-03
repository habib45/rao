import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorySchema } from "@/app/admin/_lib/schemas/category";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET() {
  if (DATA_SOURCE === "mysql") {
    const res = await fetch(`${MYSQL_API_URL}/api/categories`, { cache: "no-store" });
    const data = await res.json() as unknown[];
    return NextResponse.json(data);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories = (data ?? []).map((c) => ({
    ...c,
    product_count:
      (c.products as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = categorySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  if (DATA_SOURCE === "mysql") {
    const res = await fetch(`${MYSQL_API_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });
    return NextResponse.json(json, { status: 201 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(result.data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
