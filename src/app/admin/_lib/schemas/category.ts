import { z } from "zod";

const translationMapSchema = z.object({
  en: z.string().min(1, "English value is required"),
  "bn-BD": z.string().optional().default(""),
  sv: z.string().optional().default(""),
});

export const categorySchema = z.object({
  name: translationMapSchema,
  slug: translationMapSchema,
  description: translationMapSchema,
  amazon_node_id: z.string().nullable().default(null),
  parent_id: z.string().uuid().nullable().default(null),
  sort_order: z.number().int().min(0).default(0),
  image_url: z
    .string()
    .url()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .default(null),
  is_active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
