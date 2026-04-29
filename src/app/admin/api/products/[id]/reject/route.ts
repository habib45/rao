import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const rejectSchema = z.object({ reason: z.string().optional().default("") });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { reason } = parsed.data;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      product_status: "draft",
      rejection_reason: reason || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
