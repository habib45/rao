import { NextRequest, NextResponse } from "next/server";
import { productCreateSchema } from "@/app/admin/_lib/schemas/product";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "all";

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
