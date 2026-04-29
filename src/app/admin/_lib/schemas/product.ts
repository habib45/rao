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

const productImageInputSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  is_primary: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const productUpdateSchema = z.object({
  name: translationMapSchema,
  slug: translationMapSchema,
  description: translationMapSchema,
  meta_title: translationMapSchema,
  meta_description: translationMapSchema,
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
  publish_at: z.string().datetime({ offset: true }).nullable().optional(),
  product_status: z
    .enum(["draft", "pending_review", "approved", "published"])
    .optional(),
  rejection_reason: z.string().nullable().optional(),
  submitted_by: z.string().nullable().optional(),
  images: z.array(productImageInputSchema).optional(),
});

export const productCreateSchema = z.object({
  asin: z.string().optional().default(""),
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
  product_status: z.enum(["draft", "pending_review"]).default("draft").optional(),
  submitted_by: z.string().nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).optional().default({}),
  affiliate_url: z.string().optional().default(""),
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
