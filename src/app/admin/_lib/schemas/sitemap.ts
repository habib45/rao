import { z } from "zod";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://raofinds.com";

export const CHANGEFREQ_VALUES = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
] as const;

export const sitemapCustomEntrySchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine((u) => u.startsWith(SITE_URL), {
      message: `URL must start with ${SITE_URL}`,
    }),
  priority: z.number().min(0.1).max(1.0),
  changefreq: z.enum(CHANGEFREQ_VALUES),
  last_modified: z.string().datetime({ offset: true }).nullable().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export const sitemapCustomEntryUpdateSchema =
  sitemapCustomEntrySchema.partial();

export const sitemapExclusionPatchSchema = z
  .object({
    add: z.string().min(1).optional(),
    remove: z.string().min(1).optional(),
  })
  .refine((d) => d.add !== undefined || d.remove !== undefined, {
    message: "Provide either add or remove",
  });

export const robotsRuleSchema = z.object({
  userAgent: z.string().min(1, "userAgent is required"),
  allow: z.array(z.string()),
  disallow: z.array(z.string()),
  crawlDelay: z.number().optional(),
});

export const robotsConfigSchema = z.object({
  rules: z.array(robotsRuleSchema).min(1, "At least one rule is required"),
});

export type SitemapCustomEntryInput = z.infer<typeof sitemapCustomEntrySchema>;
export type SitemapExclusionPatch = z.infer<typeof sitemapExclusionPatchSchema>;
export type RobotsRule = z.infer<typeof robotsRuleSchema>;
export type RobotsConfig = z.infer<typeof robotsConfigSchema>;
