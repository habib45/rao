import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface NewsletterSettings {
  show: boolean;
  title: string;
  subtitle: string;
  background: "indigo" | "gray" | "dark";
}

const DEFAULT_SETTINGS: NewsletterSettings = {
  show: true,
  title: "Subscribe to our newsletter",
  subtitle:
    "Sign up to receive our latest news and products. Stay updated on the latest developments and special offers!",
  background: "indigo",
};

export const getNewsletterSettings = unstable_cache(
  async (): Promise<NewsletterSettings> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "newsletter_settings")
      .maybeSingle();

    if (!data?.value) return DEFAULT_SETTINGS;
    const v = data.value as Record<string, unknown>;
    return {
      show: typeof v.show === "boolean" ? v.show : DEFAULT_SETTINGS.show,
      title: typeof v.title === "string" ? v.title : DEFAULT_SETTINGS.title,
      subtitle:
        typeof v.subtitle === "string"
          ? v.subtitle
          : DEFAULT_SETTINGS.subtitle,
      background:
        v.background === "gray" || v.background === "dark"
          ? v.background
          : "indigo",
    };
  },
  ["newsletter-settings"],
  { revalidate: 60, tags: ["newsletter-settings"] },
);
