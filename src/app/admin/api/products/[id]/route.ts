import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productUpdateSchema } from "@/app/admin/_lib/schemas/product";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (DATA_SOURCE === "mysql") {
    const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await res.json());
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = productUpdateSchema.partial().safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  if (DATA_SOURCE === "mysql") {
    const updateData = { ...result.data } as Record<string, unknown>;
    const images = Array.isArray(updateData.images)
      ? (updateData.images as { url: string; width?: number; height?: number; is_primary?: boolean; sort_order?: number }[])
      : undefined;
    delete updateData.images;

    const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: (json as { error?: string }).error ?? "Gateway error" }, { status: res.status });

    if (images !== undefined) {
      await fetch(`${MYSQL_API_URL}/api/products/${id}/images`, { method: "DELETE" });
      for (const img of images) {
        await fetch(`${MYSQL_API_URL}/api/products/${id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(img),
        });
      }
    }
    return NextResponse.json(json);
  }

  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = { ...result.data };
  const images = Array.isArray(updateData.images) ? (updateData.images as { url: string; width?: number; height?: number; is_primary?: boolean; sort_order?: number }[]) : undefined;
  delete updateData.images;
  if (
    updateData.attributes &&
    typeof updateData.attributes === "object" &&
    !Array.isArray(updateData.attributes) &&
    Object.keys(updateData.attributes as Record<string, unknown>).length === 0
  ) {
    delete updateData.attributes;
  }

  delete updateData.product_status;
  delete updateData.rejection_reason;
  delete updateData.submitted_by;

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (images !== undefined) {
    await supabase.from("product_images").delete().eq("product_id", id);

    if (images.length > 0) {
      const imageRows = images.map((img, index) => ({
        product_id: id,
        url: img.url,
        width: img.width ?? null,
        height: img.height ?? null,
        is_primary: img.is_primary ?? index === 0,
        sort_order: img.sort_order ?? index,
        alt_text: {},
      }));

      const { error: imageError } = await supabase.from("product_images").insert(imageRows);
      if (imageError) {
        return NextResponse.json({ error: imageError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (DATA_SOURCE === "mysql") {
    const res = await fetch(`${MYSQL_API_URL}/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
