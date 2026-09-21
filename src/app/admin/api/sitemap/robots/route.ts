import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { robotsConfigSchema } from "@/app/admin/_lib/schemas/sitemap";
import { getRobotsConfig, setRobotsConfig } from "@/app/admin/_lib/queries/sitemap";

export const GET = withAdmin(async () => {
  const config = await getRobotsConfig();
  return NextResponse.json(config);
});

export const PATCH = withAdmin(async (req: NextRequest) => {
  const body: unknown = await req.json();
  const parsed = robotsConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const config = await setRobotsConfig(parsed.data);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Failed to persist robots configuration" },
      { status: 500 },
    );
  }
});
