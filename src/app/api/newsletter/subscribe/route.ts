import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().max(100).optional(),
  locale: z.enum(["en", "bn-BD", "sv"]).optional().default("en"),
  consent: z.literal(true, { error: "You must agree to the terms" }),
});

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const { email, name, locale } = parsed.data;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const supabase = createAdminClient();

  const { error } = await supabase.from("newsletter_subscribers").upsert(
    {
      email,
      name: name ?? null,
      locale,
      is_active: true,
      unsubscribed_at: null,
      ip_hash: ipHash,
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("newsletter subscribe error:", error.message);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
