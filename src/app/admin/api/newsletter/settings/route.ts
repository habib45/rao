import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { revalidateTag } from "next/cache";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

const schema = z.object({
  show: z.boolean(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500),
  background: z.enum(["indigo", "gray", "dark"]),
});

export async function GET(): Promise<NextResponse> {
  await requireAdmin();

  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings/newsletter_settings`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({});
  const row = await res.json() as { value?: unknown };
  return NextResponse.json(row.value ?? {});
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

  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings/newsletter_settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: parsed.data }),
  });
  if (!res.ok) return NextResponse.json({ error: "Gateway error" }, { status: 500 });
  revalidateTag("newsletter-settings");
  return NextResponse.json({ success: true });
}
