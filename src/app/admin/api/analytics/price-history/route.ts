import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("price_history")
    .select("id, price_cents, currency, recorded_at")
    .eq("product_id", productId)
    .order("recorded_at", { ascending: true })
    .limit(365);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
