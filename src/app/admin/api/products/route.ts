import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productCreateSchema } from "@/app/admin/_lib/schemas/product";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

function removeEmptyAttributes<T extends Record<string, unknown>>(payload: T) {
  if (
    payload.attributes &&
    typeof payload.attributes === "object" &&
    !Array.isArray(payload.attributes) &&
    Object.keys(payload.attributes as Record<string, unknown>).length === 0
  ) {
    const result = { ...payload };
    delete result.attributes;
    return result as Omit<T, "attributes">;
  }

  return payload;
}

function removeMissingColumns<T extends Record<string, unknown>>(payload: T) {
  const result = { ...payload };

  // Remove columns that might not exist in the database schema yet
  delete result.product_status;
  delete result.rejection_reason;
  delete result.submitted_by;

  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "all";

  if (DATA_SOURCE === "mysql") {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });
    if (search) params.set("search", search);
    if (category) params.set("category_id", category);
    if (status === "active") params.set("is_active", "true");
    else if (status === "inactive") params.set("is_active", "false");

    const res = await fetch(`${MYSQL_API_URL}/api/products?${params}`, { cache: "no-store" });
    const json = await res.json() as { data: unknown[]; total: number };
    return NextResponse.json({ products: json.data ?? [], total: json.total ?? 0, page, pageSize });
  }

  const supabase = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (status === "active") query = query.eq("is_active", true);
  else if (status === "inactive") query = query.eq("is_active", false);

  if (category) query = query.eq("category_id", category);

  if (search) {
    query = query.or(`name->>en.ilike.%${search}%,asin.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[products GET] query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [], total: count ?? 0, page, pageSize });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = productCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { images, ...productFields } = parsed.data;

  if (DATA_SOURCE === "mysql") {
    const payload = { ...productFields, is_active: false, images };
    const res = await fetch(`${MYSQL_API_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });

    const product = json as { id: string };
    if (images && images.length > 0) {
      for (const img of images) {
        await fetch(`${MYSQL_API_URL}/api/products/${product.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(img),
        });
      }
    }
    return NextResponse.json(product, { status: 201 });
  }

  const supabase = createAdminClient();
  const insertPayload = removeMissingColumns(removeEmptyAttributes({ ...productFields, is_active: false }));

  const { data, error } = await supabase
    .from("products")
    .insert(insertPayload)
    .select("id, asin, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (images && images.length > 0) {
    const imageRows = images.map((img, i) => ({
      product_id: data.id,
      url: img.url,
      width: img.width ?? null,
      height: img.height ?? null,
      is_primary: img.is_primary ?? i === 0,
      sort_order: img.sort_order ?? i,
      alt_text: {},
    }));
    await supabase.from("product_images").insert(imageRows);
  }

  return NextResponse.json(data, { status: 201 });
}
