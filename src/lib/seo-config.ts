/**
 * Centralized SEO configuration.
 *
 * Single source of truth for cross-search-engine discoverability settings
 * (Google, Bing, Yandex, Baidu, Apple, DuckDuckGo). Environment variables are
 * read once at import time; values that are not set fall back to safe defaults.
 *
 * Used by:
 *   - src/lib/seo.ts (canonical, OG image, description)
 *   - src/app/[locale]/layout.tsx (metadataBase, WebSite SearchAction, Organization JSON-LD, verification meta)
 *   - src/app/robots.ts (sitemap base URL, host directive)
 *   - src/app/sitemap.ts (per-locale hreflang base URL)
 *
 * If you add a new verification code or social URL, add it here and reference
 * `seoConfig` everywhere instead of reading `process.env` directly.
 */

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * Public base URL of the deployed site. Used for canonical URLs, OG image
 * absolute URLs, sitemap entries, and JSON-LD identifiers.
 *
 * The fallback is intentionally the production hostname so that previews and
 * test environments still emit valid (if non-canonical) URLs.
 */
export const SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://raofinds.com",
);

/**
 * Short brand name used in OG `siteName`, page titles (via template), and
 * Twitter card `site`/`creator` handles when no override is provided.
 */
export const SITE_SHORT_TITLE = "RaoFinds";

/**
 * Twitter handle applied to `twitter.site` and `twitter.creator` when the
 * page does not override it.
 */
export const SITE_TWITTER_HANDLE = "@raofinds";

/**
 * Default OpenGraph image used when a leaf page does not provide one.
 * Dimensions are the 1.91:1 ratio Google recommends for the `summary_large_image`
 * Twitter card and Facebook in-feed previews.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "RaoFinds - Best Products on Amazon",
} as const;

/**
 * Locales the storefront ships in. Order is significant: the first entry is
 * the implicit `x-default` target when no explicit override is provided.
 */
export const SUPPORTED_LOCALES = ["en", "bn-BD", "sv"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Social profile URLs surfaced in the Organization JSON-LD `sameAs` array.
 * Empty values are filtered out so the JSON-LD never contains blank strings.
 */
export const SOCIAL_PROFILES = {
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER ?? "https://twitter.com/raofinds",
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "https://facebook.com/raofinds",
  linkedin:
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "https://linkedin.com/company/raofinds",
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "",
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "",
  pinterest: process.env.NEXT_PUBLIC_SOCIAL_PINTEREST ?? "",
} as const;

/**
 * Search-engine verification meta tags.
 * Each entry corresponds to a `<meta name="..." content="...">` tag rendered
 * in the locale layout's `<head>`. Empty strings are filtered out.
 *
 * Set these in the deployment environment to claim the site in the relevant
 * webmaster tools (Bing Webmaster, Yandex Webmaster, Apple App Search Ads,
 * Microsoft Bing for Business).
 */
export const VERIFICATION_CODES = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "",
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "",
  apple: process.env.NEXT_PUBLIC_APPLE_VERIFICATION ?? "",
  microsoft: process.env.NEXT_PUBLIC_MSCLT_SITE_VERIFICATION ?? "",
  baidu: process.env.NEXT_PUBLIC_BAIDU_SITE_VERIFICATION ?? "",
  pinterest: process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION ?? "",
  facebookDomain:
    process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION ?? "",
  norton: process.env.NEXT_PUBLIC_NORTON_DC_TOKEN ?? "",
} as const;

/**
 * Apple iTunes app metadata. Empty values are filtered; if no app id is set,
 * the `apple-itunes-app` meta tag is omitted entirely.
 */
export const APPLE_ITUNES_APP = {
  appId: process.env.NEXT_PUBLIC_APPLE_ITUNES_APP_ID ?? "",
  affiliateData: process.env.NEXT_PUBLIC_APPLE_ITUNES_AFFILIATE_DATA ?? "",
  argument: process.env.NEXT_PUBLIC_APPLE_ITUNES_APP_ARGUMENT ?? "",
} as const;

/**
 * Host directive surfaced in `/robots.txt`. Most crawlers (Google, Bing,
 * Yandex) accept the `Host` directive to disambiguate mirror hosts.
 */
export const ROBOTS_HOST = process.env.NEXT_PUBLIC_ROBOTS_HOST ?? SITE_URL;

/**
 * Convenience accessor that exposes every config knob in one object. Useful
 * when a single component or helper needs multiple fields.
 */
export const seoConfig = {
  siteUrl: SITE_URL,
  siteShortTitle: SITE_SHORT_TITLE,
  twitterHandle: SITE_TWITTER_HANDLE,
  defaultOgImage: DEFAULT_OG_IMAGE,
  supportedLocales: SUPPORTED_LOCALES,
  socialProfiles: SOCIAL_PROFILES,
  verificationCodes: VERIFICATION_CODES,
  appleItunesApp: APPLE_ITUNES_APP,
  robotsHost: ROBOTS_HOST,
} as const;

/**
 * Build hreflang alternates from any caller. Mirrors `buildAlternates` in
 * `@/lib/seo.ts` but lives in the config module so non-metadata code paths
 * (the locale layout, the sitemap, the robots route) can produce the same
 * shape without depending on the metadata helpers.
 *
 * `pathAfterLocale` is the URL path *after* the locale segment, e.g.
 * `buildAlternatesFromConfig("/products/foo")` → `{ en: "/en/products/foo",
 * "bn-BD": "/bn-BD/products/foo", sv: "/sv/products/foo", "x-default":
 * "/en/products/foo" }`.
 */
export const buildAlternatesFromConfig = (
  pathAfterLocale: string,
  fallbackLocale: SupportedLocale = "en",
): Record<string, string> => {
  const normalized = pathAfterLocale.startsWith("/")
    ? pathAfterLocale
    : `/${pathAfterLocale}`;
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = `/${loc}${normalized === "/" ? "" : normalized}`;
  }
  languages["x-default"] = languages[fallbackLocale];
  return languages;
};