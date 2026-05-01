import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogPost, BlogCategory } from "@/types/domain";

const BLOG_SELECT = `
  *,
  blog_categories(*),
  blog_post_tags(blog_tags(*))
`;

export async function getPublishedBlogPosts(
  limit = 20,
  offset = 0,
  categoryId?: string,
  search?: string,
): Promise<BlogPost[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published");

  const trimmedSearch = search?.trim();
  if (categoryId) query = query.eq("blog_category_id", categoryId);
  if (trimmedSearch) {
    query = query.textSearch("search_vector", trimmedSearch, {
      type: "websearch",
      config: "english",
    });
  }

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("getPublishedBlogPosts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedBlogPosts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

export async function getTrendingBlogPosts(limit = 5): Promise<BlogPost[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getTrendingBlogPosts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published")
    .or(`slug->>en.eq.${slug},slug->>"bn-BD".eq.${slug},slug->>sv.eq.${slug}`)
    .single();

  if (error) {
    console.error("getBlogPostBySlug error:", error.message);
    return null;
  }
  return data as unknown as BlogPost;
}

export async function getActiveBlogCategories(): Promise<BlogCategory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getActiveBlogCategories error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogCategory[];
}

export async function getBlogPostsByCategory(
  categoryId: string,
  limit = 12,
): Promise<BlogPost[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published")
    .eq("blog_category_id", categoryId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getBlogPostsByCategory error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

export async function getBlogCategoryBySlug(
  slug: string,
): Promise<BlogCategory | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("is_active", true)
    .or(
      `slug->>en.eq.${slug},slug->>"bn-BD".eq.${slug},slug->>sv.eq.${slug}`,
    )
    .maybeSingle();

  if (error) {
    console.error("getBlogCategoryBySlug error:", error.message);
    return null;
  }
  return (data ?? null) as unknown as BlogCategory | null;
}

export async function getRelatedBlogPosts(
  postId: string,
  categoryId: string | null,
  limit = 3,
): Promise<BlogPost[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published")
    .neq("id", postId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq("blog_category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getRelatedBlogPosts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

export async function incrementBlogPostView(postId: string): Promise<void> {
  const supabase = await createServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("blog_posts")
    .select("view_count")
    .eq("id", postId)
    .maybeSingle();

  if (fetchError || !row) {
    console.error(
      "incrementBlogPostView fetch error:",
      fetchError?.message ?? "post not found",
    );
    return;
  }

  const current =
    typeof (row as { view_count?: number }).view_count === "number"
      ? (row as { view_count: number }).view_count
      : 0;

  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({ view_count: current + 1 })
    .eq("id", postId);

  if (updateError) {
    console.error("incrementBlogPostView update error:", updateError.message);
  }
}

export async function submitBlogComment(
  postId: string,
  authorName: string,
  authorEmail: string,
  body: string,
): Promise<boolean> {
  const supabase = await createServerClient();
  const { error } = await supabase.from("blog_comments").insert({
    blog_post_id: postId,
    author_name: authorName,
    author_email: authorEmail,
    body,
    is_approved: false,
  });

  if (error) {
    console.error("submitBlogComment error:", error.message);
    return false;
  }
  return true;
}

export async function searchBlogPosts(
  query: string,
  limit = 12,
): Promise<BlogPost[]> {
  const supabase = await createServerClient();
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("status", "published")
    .textSearch("search_vector", trimmed, {
      type: "websearch",
      config: "english",
    })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("searchBlogPosts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

export async function getPublishedBlogPostsCount(
  categoryId?: string,
  search?: string,
): Promise<number> {
  const supabase = await createServerClient();
  let query = supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const trimmedSearch = search?.trim();
  if (categoryId) query = query.eq("blog_category_id", categoryId);
  if (trimmedSearch) {
    query = query.textSearch("search_vector", trimmedSearch, {
      type: "websearch",
      config: "english",
    });
  }

  const { count, error } = await query;

  if (error) {
    console.error("getPublishedBlogPostsCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(BLOG_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getBlogPostById error:", error.message);
    return null;
  }
  return (data ?? null) as unknown as BlogPost | null;
}

export async function getApprovedBlogComments(postId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_comments")
    .select("id, author_name, body, created_at")
    .eq("blog_post_id", postId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getApprovedBlogComments error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getAllPublishedSlugs(): Promise<
  { en: string; "bn-BD"?: string; sv?: string; updated_at: string }[]
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published");

    if (error) {
      console.error("getAllPublishedSlugs error:", error.message);
      return [];
    }
    return (data ?? []).map((row) => ({
      ...((row as { slug: Record<string, string> }).slug ?? { en: "" }),
      updated_at: (row as { updated_at: string }).updated_at,
    })) as { en: string; "bn-BD"?: string; sv?: string; updated_at: string }[];
  } catch (err) {
    console.warn("getAllPublishedSlugs unavailable during build - relying on ISR:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getAllActiveCategorySlugs(): Promise<
  { en: string; "bn-BD"?: string; sv?: string }[]
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_categories")
      .select("slug")
      .eq("is_active", true);

    if (error) {
      console.error("getAllActiveCategorySlugs error:", error.message);
      return [];
    }
    return (data ?? []).map(
      (row) => (row as { slug: Record<string, string> }).slug ?? { en: "" },
    ) as { en: string; "bn-BD"?: string; sv?: string }[];
  } catch (err) {
    console.warn("getAllActiveCategorySlugs unavailable during build - relying on ISR:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
