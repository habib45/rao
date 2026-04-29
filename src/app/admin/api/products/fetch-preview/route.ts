import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  previewFromPAAPIItem,
  transformCatalogItemResponse,
} from "@/lib/amazon/transformers";
import type { PAAPIItem, CatalogItemResponse } from "@/lib/amazon/types";

const bodySchema = z.union([
  z.object({ asin: z.string().regex(/^[A-Z0-9]{10}$/, "Invalid ASIN") }),
  z.object({ catalog_item: z.record(z.string(), z.unknown()) }),
]);

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Path 1: raw getCatalogItem JSON pasted by the user
  if ("catalog_item" in parsed.data) {
    const preview = transformCatalogItemResponse(
      parsed.data.catalog_item as unknown as CatalogItemResponse,
    );
    return NextResponse.json(preview);
  }

  // Path 2: fetch live from Amazon via the import-product Edge Function
  const { asin } = parsed.data;
  const supabase = createAdminClient();

  const invocation = await supabase.functions.invoke<{ item: PAAPIItem }>(
    "import-product",
    { body: { asin } },
  );

  if (invocation.error) {
    console.error("[fetch-preview] Edge function error:", invocation.error.message);
    return NextResponse.json(
      { error: `Amazon fetch failed: ${invocation.error.message}` },
      { status: 502 },
    );
  }

  const item = invocation.data?.item;
  if (!item) {
    console.error("[fetch-preview] ASIN not found:", asin);
    return NextResponse.json(
      { error: "ASIN not found on Amazon" },
      { status: 404 },
    );
  }

  return NextResponse.json(previewFromPAAPIItem(item));
}
