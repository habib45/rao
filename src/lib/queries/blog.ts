import type { BlogPost, BlogCategory } from "@/types/domain";
import {
  gwGetPublishedBlogPosts,
  gwGetFeaturedBlogPosts,
  gwGetTrendingBlogPosts,
  gwGetBlogPostBySlug,
  gwGetActiveBlogCategories,
  gwGetBlogPostsByCategory,
  gwGetBlogCategoryBySlug,
  gwGetRelatedBlogPosts,
  gwGetPublishedBlogPostsCount,
  gwGetApprovedBlogComments,
  gwGetAllPublishedSlugs,
  gwGetAllActiveCategorySlugs,
} from "@/lib/api/gateway";

export async function getPublishedBlogPosts(
  limit = 20,
  offset = 0,
  categoryId?: string,
  search?: string,
): Promise<BlogPost[]> {
  return gwGetPublishedBlogPosts(limit, offset, categoryId, search);
}

export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  return gwGetFeaturedBlogPosts(limit);
}

export async function getTrendingBlogPosts(limit = 5): Promise<BlogPost[]> {
  return gwGetTrendingBlogPosts(limit);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return gwGetBlogPostBySlug(slug);
}

export async function getActiveBlogCategories(): Promise<BlogCategory[]> {
  return gwGetActiveBlogCategories();
}

export async function getBlogPostsByCategory(
  categoryId: string,
  limit = 12,
): Promise<BlogPost[]> {
  return gwGetBlogPostsByCategory(categoryId, limit);
}

export async function getBlogCategoryBySlug(
  slug: string,
): Promise<BlogCategory | null> {
  return gwGetBlogCategoryBySlug(slug);
}

export async function getRelatedBlogPosts(
  postId: string,
  categoryId: string | null,
  limit = 3,
): Promise<BlogPost[]> {
  return gwGetRelatedBlogPosts(postId, categoryId, limit);
}

export async function getPublishedBlogPostsCount(
  categoryId?: string,
  search?: string,
): Promise<number> {
  return gwGetPublishedBlogPostsCount(categoryId, search);
}

export async function getApprovedBlogComments(postId: string) {
  return gwGetApprovedBlogComments(postId);
}

export async function getAllPublishedSlugs(): Promise<
  { en: string; "bn-BD"?: string; sv?: string; updated_at: string }[]
> {
  return gwGetAllPublishedSlugs();
}

export async function getAllActiveCategorySlugs(): Promise<
  { en: string; "bn-BD"?: string; sv?: string }[]
> {
  return gwGetAllActiveCategorySlugs();
}
