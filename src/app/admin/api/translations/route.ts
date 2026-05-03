import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translationUpdateSchema } from "@/app/admin/_lib/schemas/translation";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
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

  if (DATA_SOURCE === "mysql") {
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

  const supabase = createAdminClient();
  const extra = table === "products" ? ", asin" : "";
  const selectFields = ["id", ...fields].join(", ");

  const { data, error } = await supabase
    .from(table)
    .select(`${selectFields}${extra}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const missing: { field: string; locale: string }[] = [];
    for (const field of fields) {
      const map = r[field] as Record<string, string> | null;
      for (const locale of LOCALES) {
        if (!map?.[locale]) missing.push({ field, locale });
      }
    }
    return { ...r, _missing: missing };
  });

  return NextResponse.json({ table, fields, locales: LOCALES, rows });
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

  if (DATA_SOURCE === "mysql") {
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

  const supabase = createAdminClient();
  const errors: string[] = [];

  for (const update of result.data.updates) {
    if (!TRANSLATABLE_FIELDS[update.table]?.includes(update.field)) {
      errors.push(`Invalid field: ${update.table}.${update.field}`);
      continue;
    }

    const { data: current } = await supabase
      .from(update.table)
      .select(update.field)
      .eq("id", update.id)
      .single();

    if (!current) {
      errors.push(`Row not found: ${update.table}/${update.id}`);
      continue;
    }

    const currentRecord = current as unknown as Record<string, unknown>;
    const map = (currentRecord[update.field] as Record<string, string>) ?? {};
    map[update.locale] = update.value;

    const { error } = await supabase
      .from(update.table)
      .update({ [update.field]: map })
      .eq("id", update.id);

    if (error) {
      errors.push(`Failed to update ${update.table}/${update.id}.${update.field}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }

  return NextResponse.json({ ok: true });
}
