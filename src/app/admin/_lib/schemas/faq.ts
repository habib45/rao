import { z } from "zod";

export const faqSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  question: z.string().min(1, "Question is required").max(500, "Question too long"),
  answer: z.string().min(1, "Answer is required").max(2000, "Answer too long"),
  locale: z.enum(["en", "bn-BD", "sv"]).default("en"),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type FAQInput = z.infer<typeof faqSchema>;

export const faqUpdateSchema = faqSchema.partial().extend({
  id: z.string().uuid(),
});

export type FAQUpdateInput = z.infer<typeof faqUpdateSchema>;
