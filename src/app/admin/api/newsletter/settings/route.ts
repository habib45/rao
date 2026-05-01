import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

const schema = z.object({
  show: z.boolean(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500),
  background: z.enum(["indigo", "gray", "dark"]),
});

export async function GET(): Promise<NextResponse> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "newsletter_settings")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data?.value ?? {});
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_settings")
    .upsert({ key: "newsletter_settings", value: parsed.data }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("newsletter-settings");
  return NextResponse.json({ success: true });
}
