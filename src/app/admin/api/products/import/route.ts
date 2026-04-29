import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productImportSchema } from "@/app/admin/_lib/schemas/product";
import { transformPAAPIItem, extractPrimaryImage } from "@/lib/amazon/transformers";
import type { PAAPIItem } from "@/lib/amazon/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = productImportSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.flatten() },
      { status: 400 },
    );
  }

  const { asin } = result.data;
  const supabase = createAdminClient();

  // Fetch the live product from Amazon via the Edge Function.
  // Amazon credentials never leave the Supabase Edge runtime.
  const invocation = await supabase.functions.invoke<{ item: PAAPIItem }>(
    "import-product",
    { body: { asin } },
  );

  if (invocation.error) {
    return NextResponse.json(
      { error: `Amazon import failed: ${invocation.error.message}` },
      { status: 502 },
    );
  }

  const item = invocation.data?.item;
  if (!item) {
    return NextResponse.json(
      { error: "Amazon import failed: ASIN not found on Amazon" },
      { status: 502 },
    );
  }

  const row = { ...transformPAAPIItem(item), is_active: false };
  if (row.attributes && Object.keys(row.attributes).length === 0) {
    delete (row as { attributes?: unknown }).attributes;
  }

  // Remove columns that might not exist in the database schema yet
  const cleanRow: Record<string, unknown> = { ...row };
  delete cleanRow.product_status;
  delete cleanRow.rejection_reason;
  delete cleanRow.submitted_by;

  const { data: inserted, error: upsertError } = await supabase
    .from("products")
    .upsert(cleanRow, { onConflict: "asin" })
    .select("id, asin, name")
    .single();

  if (upsertError || !inserted) {
    return NextResponse.json(
      { error: upsertError?.message ?? "Failed to save product" },
      { status: 500 },
    );
  }

  const image = extractPrimaryImage(item);
  if (image) {
    await supabase.from("product_images").upsert(
      {
        product_id: inserted.id,
        url: image.url,
        width: image.width,
        height: image.height,
        is_primary: true,
        sort_order: 0,
      },
      { onConflict: "product_id,is_primary" },
    );
  }

  return NextResponse.json(
    {
      product_id: inserted.id,
      asin: inserted.asin,
      name: inserted.name,
    },
    { status: 201 },
  );
}
