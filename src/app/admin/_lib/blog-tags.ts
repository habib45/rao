import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function syncPostTags(postId: string, tagNames: string[]) {
  const supabase = createAdminClient();
  const cleaned = tagNames
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (cleaned.length === 0) {
    await supabase.from("blog_post_tags").delete().eq("blog_post_id", postId);
    return;
  }

  const tagIds: string[] = [];
  for (const name of cleaned) {
    const slugStr = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: existing } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug->>en", slugStr)
      .maybeSingle();

    if (existing && (existing as { id: string }).id) {
      tagIds.push((existing as { id: string }).id);
      continue;
    }

    const { data: created, error: createErr } = await supabase
      .from("blog_tags")
      .insert({
        name: { en: name },
        slug: { en: slugStr },
      })
      .select("id")
      .single();

    if (!createErr && created) {
      tagIds.push((created as { id: string }).id);
    }
  }

  await supabase.from("blog_post_tags").delete().eq("blog_post_id", postId);
  if (tagIds.length > 0) {
    await supabase.from("blog_post_tags").insert(
      tagIds.map((tagId) => ({
        blog_post_id: postId,
        blog_tag_id: tagId,
      })),
    );
  }
}
