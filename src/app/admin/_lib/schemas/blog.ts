import { z } from "zod";

const uuidLike = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  "Invalid UUID",
);

const requiredEnTranslation = z.object({
  en: z.string().min(1, "English value is required"),
  "bn-BD": z.string().optional(),
  sv: z.string().optional(),
});

const optionalTranslation = z.object({
  en: z.string().optional(),
  "bn-BD": z.string().optional(),
  sv: z.string().optional(),
});

const nullableUrl = z
  .string()
  .url()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v === "" || v === null ? null : v));

export const blogPostInputSchema = z.object({
  blog_category_id: uuidLike.nullable().optional(),
  title: requiredEnTranslation,
  slug: requiredEnTranslation,
  excerpt: optionalTranslation.optional(),
  content: z.string().optional().default(""),
  cover_image_url: nullableUrl.optional(),
  cover_image_alt: optionalTranslation.optional(),
  author_name: z.string().min(1).default("RaoFinds"),
  author_avatar_url: z.string().url().nullable().optional().default("/uploads/Profile/profile-male.png"),
  meta_title: optionalTranslation.optional(),
  meta_description: optionalTranslation.optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  is_featured: z.boolean().default(false),
  read_time_minutes: z.number().int().min(0).default(0),
  overall_seo_score: z.number().int().min(0).max(100).nullable().optional(),
  published_at: z.string().nullable().optional(),
  tag_names: z.array(z.string()).optional(),
});

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

export const blogCategoryInputSchema = z.object({
  name: requiredEnTranslation,
  slug: requiredEnTranslation,
  description: optionalTranslation.optional(),
  color: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type BlogCategoryInput = z.infer<typeof blogCategoryInputSchema>;

export const blogCommentInputSchema = z.object({
  postId: uuidLike,
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  body: z.string().min(1).max(5000),
});

export type BlogCommentInput = z.infer<typeof blogCommentInputSchema>;

export const blogViewInputSchema = z.object({
  postId: uuidLike,
});

export type BlogViewInput = z.infer<typeof blogViewInputSchema>;
