import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { sitemapExclusionPatchSchema } from "@/app/admin/_lib/schemas/sitemap";
import {
  getSitemapExclusions,
  setSitemapExclusions,
} from "@/app/admin/_lib/queries/sitemap";

export async function GET() {
  await requireAdmin();
  const slugs = await getSitemapExclusions();
  return NextResponse.json({ slugs });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const body: unknown = await req.json();
  const parsed = sitemapExclusionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const current = await getSitemapExclusions();
  let updated: string[];

  if (parsed.data.add) {
    updated = current.includes(parsed.data.add)
      ? current
      : [...current, parsed.data.add];
  } else {
    updated = current.filter((s) => s !== parsed.data.remove);
  }

  const slugs = await setSitemapExclusions(updated);
  return NextResponse.json({ slugs });
}
