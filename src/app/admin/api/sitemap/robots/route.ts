import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { robotsConfigSchema } from "@/app/admin/_lib/schemas/sitemap";
import { getRobotsConfig, setRobotsConfig } from "@/app/admin/_lib/queries/sitemap";

export async function GET() {
  await requireAdmin();
  const config = await getRobotsConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const body: unknown = await req.json();
  const parsed = robotsConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const config = await setRobotsConfig(parsed.data);
  return NextResponse.json(config);
}
