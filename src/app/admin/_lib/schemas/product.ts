import { z } from "zod";

const uuidLike = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  "Invalid UUID",
);

const translationMapSchema = z.object({
  en: z.string().min(1, "English value is required"),
  "bn-BD": z.string().optional().default(""),
  sv: z.string().optional().default(""),
});

const translationMapOptional = z.object({
  en: z.string().default(""),
  "bn-BD": z.string().default(""),
  sv: z.string().default(""),
}).partial();

// Image URLs accepted by the admin product editor.
//
// The editor supports three flavors of URL:
//
//   1. Full http(s) / data URLs (Amazon CDN, remote blog assets, etc.).
//   2. Same-origin static uploads served from `/uploads/...`. The upload
//      endpoint in `/admin/api/public-media/upload` returns relative paths
//      like `/uploads/products/foo.png`, which Next.js serves from
//      `public/uploads/`. We must accept these on the PATCH body because
//      every freshly-uploaded image produces one, and rejecting them
//      here broke save after upload.
//   3. Absolute filesystem paths / `file://` URLs from a localhost admin
//      picker. These never reach the gateway (the picker uploads first),
//      but the schema tolerates them so the form state is round-trippable.
//
// Anything else (empty, longer than 2048 chars, or with whitespace) is
// rejected.
const imageUrlSchema = z
  .string()
  .min(1, "Image URL is required")
  .max(2048)
  .refine(
    (s) => {
      const trimmed = s.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("/uploads/")) return true;
      if (trimmed.startsWith("file://")) return true;
      // POSIX absolute path (`/foo/bar/baz.png`) or Windows absolute path
      // (`C:\foo\bar.png`). We tolerate these so the form state can carry
      // them before the picker proxies them onto the server.
      if (/^\/[^\s]+$/.test(trimmed)) return true;
      if (/^[a-zA-Z]:[\\/][^\s]+$/.test(trimmed)) return true;
      // Otherwise require a parseable http(s) URL.
      try {
        const u = new URL(trimmed);
        return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "data:";
      } catch {
        return false;
      }
    },
    { message: "Invalid image URL" },
  );

const productImageInputSchema = z.object({
  id: z.string().uuid().optional(),
  url: imageUrlSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  is_primary: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const productUpdateSchema = z.object({
  name: translationMapSchema,
  slug: translationMapSchema,
  description: translationMapOptional,
  meta_title: translationMapOptional,
  meta_description: translationMapOptional,
  features: z.array(z.string()),
  price_cents: z.number().int().nullable(),
  original_price_cents: z.number().int().nullable(),
  currency: z.string().min(1).default("USD"),
  discount_pct: z.number().int().min(0).max(100).default(0),
  category_id: uuidLike.nullable(),
  brand: z.string().nullable(),
  availability: z.enum(["in_stock", "out_of_stock", "unknown"]),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  show_in_comparison: z.boolean(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  publish_at: z.string().datetime({ offset: true }).nullable().optional(),
  product_status: z
    .enum(["draft", "pending_review", "approved", "published"])
    .optional(),
  rejection_reason: z.string().nullable().optional(),
  submitted_by: z.string().nullable().optional(),
  images: z.array(productImageInputSchema).optional(),
});

export const productCreateSchema = z.object({
  asin: z.string().min(1, "ASIN is required"),
  name: translationMapSchema,
  slug: translationMapSchema,
  description: translationMapOptional.optional(),
  meta_title: translationMapOptional.optional(),
  meta_description: translationMapOptional.optional(),
  features: z.array(z.string()).default([]),
  price_cents: z.number().int().nullable().default(null),
  original_price_cents: z.number().int().nullable().default(null),
  currency: z.string().default("USD"),
  discount_pct: z.number().int().min(0).max(100).default(0),
  category_id: uuidLike.nullable().default(null),
  brand: z.string().nullable().default(null),
  availability: z
    .enum(["in_stock", "out_of_stock", "unknown"])
    .default("unknown"),
  is_featured: z.boolean().default(false),
  show_in_comparison: z.boolean().default(false),
  product_status: z.enum(["draft", "pending_review"]).default("draft").optional(),
  submitted_by: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).optional().default({}),
  affiliate_url: z.string().min(1, "Affiliate URL is required"),
  images: z.array(productImageInputSchema).optional().default([]),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productImportSchema = z.object({
  asin: z
    .string()
    .regex(/^[A-Z0-9]{10}$/, "ASIN must be 10 uppercase letters or digits"),
});

export type ProductImportInput = z.infer<typeof productImportSchema>;

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
