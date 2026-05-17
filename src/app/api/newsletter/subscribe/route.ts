import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  consent: z.boolean(),
  locale: z.string().optional(),
});

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, name, consent, locale } = parsed.data;

  if (!consent) {
    return NextResponse.json({ error: "Consent required" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const res = await fetch(`${MYSQL_API_URL}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: name ?? null, locale: locale ?? "en", ip_hash: ipHash }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (json as { error?: string }).error ?? "Subscription failed" }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
