import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { revalidatePath } from "next/cache";
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
    // Handle both single string and array of strings
    const itemsToAdd = Array.isArray(parsed.data.add) ? parsed.data.add : [parsed.data.add];
    // Filter out null/undefined values and empty strings
    const validItemsToAdd = itemsToAdd.filter(item => item && typeof item === 'string' && item.trim().length > 0);
    updated = [...new Set([...current, ...validItemsToAdd])];
  } else if (parsed.data.remove) {
    updated = current.filter((s) => s !== parsed.data.remove);
  } else {
    updated = current;
  }

  const slugs = await setSitemapExclusions(updated);
  
  // Revalidate sitemap to reflect changes
  revalidatePath("/sitemap.xml", "page");
  revalidatePath("/admin/sitemap", "page");
  
  // Calculate actual added count (new items that weren't already in the list)
  const addedCount = parsed.data.add 
    ? (Array.isArray(parsed.data.add) ? parsed.data.add.length : 1) 
    : 0;
  
  return NextResponse.json({ 
    success: true, 
    slugs,
    added: addedCount,
    removed: parsed.data.remove ? 1 : 0
  });
}
