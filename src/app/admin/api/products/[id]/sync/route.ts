import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get product ASIN
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("asin")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Invoke the sync edge function for this specific product
  const { data, error } = await supabase.functions.invoke("sync-amazon-products", {
    body: { asins: [product.asin], force: true },
  });

  if (error) {
    // Log to sync_logs
    await supabase.from("sync_logs").insert({
      function_name: "sync-amazon-products",
      status: "error",
      items_processed: 0,
      errors: [{ asin: product.asin, message: error.message }],
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log success
  await supabase.from("sync_logs").insert({
    function_name: "sync-amazon-products",
    status: "success",
    items_processed: 1,
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, result: data });
}
