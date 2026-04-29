import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productUpdateSchema } from "@/app/admin/_lib/schemas/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Remove columns that might not exist in the database schema yet
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
