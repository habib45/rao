import { z } from "zod";

const translationMapSchema = z.object({
  en: z.string().min(1, "English value is required"),
  "bn-BD": z.string().optional().default(""),
  sv: z.string().optional().default(""),
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
  category_id: z.string().uuid().nullable(),
  brand: z.string().nullable(),
  availability: z.enum(["in_stock", "out_of_stock", "unknown"]),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
