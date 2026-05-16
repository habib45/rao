import "server-only";
import { unstable_cache } from "next/cache";

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
    // TODO: Implement via API gateway when available
    return DEFAULT_SETTINGS;
  },
  ["newsletter-settings"],
  { revalidate: 60, tags: ["newsletter-settings"] },
);
