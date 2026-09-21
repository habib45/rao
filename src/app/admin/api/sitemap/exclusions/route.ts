import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { revalidatePath } from "next/cache";
import { sitemapExclusionPatchSchema } from "@/app/admin/_lib/schemas/sitemap";
import {
  getSitemapExclusions,
  setSitemapExclusions,
} from "@/app/admin/_lib/queries/sitemap";

export const GET = withAdmin(async () => {
  const slugs = await getSitemapExclusions();
  return NextResponse.json({ slugs });
});

export const PATCH = withAdmin(async (req: NextRequest) => {
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

  let slugs: string[];
  try {
    slugs = await setSitemapExclusions(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to persist sitemap exclusions" },
      { status: 500 },
    );
  }
  
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
});
