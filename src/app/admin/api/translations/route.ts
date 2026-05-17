import { NextRequest, NextResponse } from "next/server";
import { translationUpdateSchema } from "@/app/admin/_lib/schemas/translation";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

const TRANSLATABLE_FIELDS: Record<string, string[]> = {
  products: ["name", "slug", "description", "meta_title", "meta_description"],
  categories: ["name", "slug", "description"],
};

const LOCALES = ["en", "bn-BD", "sv"] as const;

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get("table") ?? "products";

  if (!TRANSLATABLE_FIELDS[table]) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const fields = TRANSLATABLE_FIELDS[table];
  const endpoint = table === "products" ? "/api/products" : "/api/categories";
  const params = new URLSearchParams({ limit: "200", is_active: "true" });
  const res = await fetch(`${MYSQL_API_URL}${endpoint}?${params}`, { cache: "no-store" });
  const json = await res.json() as { data?: unknown[] } | unknown[];
  const rows = (Array.isArray(json) ? json : (json as { data?: unknown[] }).data ?? []) as Record<string, unknown>[];

  const annotated = rows.map((row) => {
    const missing: { field: string; locale: string }[] = [];
    for (const field of fields) {
      const map = row[field] as Record<string, string> | null;
      for (const locale of LOCALES) {
        if (!map?.[locale]) missing.push({ field, locale });
      }
    }
    return { ...row, _missing: missing };
  });

  return NextResponse.json({ table, fields, locales: LOCALES, rows: annotated });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const result = translationUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  for (const update of result.data.updates) {
    if (!TRANSLATABLE_FIELDS[update.table]?.includes(update.field)) {
      errors.push(`Invalid field: ${update.table}.${update.field}`);
      continue;
    }
    const endpoint = update.table === "products"
      ? `/api/products/${update.id}`
      : `/api/categories/${update.id}`;
    const getRes = await fetch(`${MYSQL_API_URL}${endpoint}`, { cache: "no-store" });
    if (!getRes.ok) { errors.push(`Row not found: ${update.table}/${update.id}`); continue; }
    const current = await getRes.json() as Record<string, unknown>;
    const map = ((current[update.field] as Record<string, string>) ?? {});
    map[update.locale] = update.value;
    const patchRes = await fetch(`${MYSQL_API_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [update.field]: map }),
    });
    if (!patchRes.ok) errors.push(`Failed to update ${update.table}/${update.id}.${update.field}`);
  }
  if (errors.length > 0) return NextResponse.json({ ok: false, errors }, { status: 207 });
  return NextResponse.json({ ok: true });
}
