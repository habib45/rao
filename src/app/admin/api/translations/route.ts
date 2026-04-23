import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translationUpdateSchema } from "@/app/admin/_lib/schemas/translation";

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

  const supabase = createAdminClient();
  const fields = TRANSLATABLE_FIELDS[table];
  const selectFields = ["id", ...fields].join(", ");

  // Also grab a display identifier
  const extra = table === "products" ? ", asin" : "";

  const { data, error } = await supabase
    .from(table)
    .select(`${selectFields}${extra}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Annotate each row with missing translations
  const rows = (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const missing: { field: string; locale: string }[] = [];
    for (const field of fields) {
      const map = r[field] as Record<string, string> | null;
      for (const locale of LOCALES) {
        if (!map?.[locale]) {
          missing.push({ field, locale });
        }
      }
    }
    return { ...r, _missing: missing };
  });

  return NextResponse.json({
    table,
    fields,
    locales: LOCALES,
    rows,
  });
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

  const supabase = createAdminClient();
  const errors: string[] = [];

  for (const update of result.data.updates) {
    if (!TRANSLATABLE_FIELDS[update.table]?.includes(update.field)) {
      errors.push(`Invalid field: ${update.table}.${update.field}`);
      continue;
    }

    // Fetch current value
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
