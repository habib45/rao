import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorySchema } from "@/app/admin/_lib/schemas/category";

export async function GET() {
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
