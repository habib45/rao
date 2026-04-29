import { z } from "zod";

export const translationUpdateSchema = z.object({
  updates: z.array(
    z.object({
      table: z.enum(["products", "categories"]),
      id: z.string().uuid(),
      field: z.string().min(1),
      locale: z.enum(["en", "bn-BD", "sv"]),
      value: z.string(),
    })
  ),
});

export type TranslationUpdate = z.infer<typeof translationUpdateSchema>;
