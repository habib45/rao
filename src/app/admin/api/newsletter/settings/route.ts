import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { badRequest, gatewayError } from "@/lib/api/errors";
import { revalidateTag } from "next/cache";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

const schema = z.object({
  show: z.boolean(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500),
  background: z.enum(["indigo", "gray", "dark"]),
});

export const GET = withAdmin(async () => {
  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings/newsletter_settings`, {
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({});
  const row = (await res.json()) as { value?: unknown };
  return NextResponse.json(row.value ?? {});
});

export const PATCH = withAdmin(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest({ reason: "Invalid JSON" });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest({ issues: parsed.error.issues });
  }

  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings/newsletter_settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: parsed.data }),
  });
  if (!res.ok) return gatewayError({ reason: "Failed to save newsletter settings" });
  revalidateTag("newsletter-settings");
  return NextResponse.json({ success: true });
});
