import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE,
  SITE_SHORT_TITLE,
  SITE_TWITTER_HANDLE,
  SITE_URL,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/seo-config";

const DEFAULT_DESCRIPTION =
  "Shop the best Amazon products with expert reviews, comparisons & deals. Find trusted products at unbeatable prices. Start saving today!";

/**
 * Map from a supported locale code (e.g. "en", "bn-BD", "sv") to the
 * OpenGraph `locale` value that Facebook / LinkedIn crawlers expect.
 *
 * Format is `xx_YY` — language in lowercase, region in uppercase, joined by
 * an underscore. Reference: https://ogp.me/#optional
 */
const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: "en_US",
  "bn-BD": "bn_BD",
  sv: "sv_SE",
};

/**
 * Locale string for the `og:title` element. Same shape as `og:locale`.
 */
const OG_LOCALE_ALT_MAP: Record<SupportedLocale, string[]> = {
  // og:locale:alternate should list *other* locales — never the page's own
  // locale. Facebook/LinkedIn crawlers warn when a self-referential entry
  // appears.
  en: ["bn_BD", "sv_SE"],
  "bn-BD": ["en_US", "sv_SE"],
  sv: ["en_US", "bn_BD"],
};

type OgImageDescriptor = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type BuildMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: OgImageDescriptor;
  noIndex?: boolean;
  /**
   * Override the canonical / OpenGraph locale. Defaults to the page's
   * inferred locale (passed by the caller via `buildAlternates`).
   */
  locale?: SupportedLocale;
};

type BuildArticleMetadataOptions = BuildMetadataOptions & {
  publishedTime: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
};

type BuildProductMetadataOptions = BuildMetadataOptions & {
  price?: number;
  currency?: string;
  availability?: "in_stock" | "out_of_stock";
  rating?: number;
  reviewCount?: number;
};

/**
 * Convert a relative path or absolute URL into an absolute URL.
 * Falls back to the SITE_URL when the input cannot be parsed.
 */
export const absoluteUrl = (pathOrUrl?: string): string => {
  if (!pathOrUrl) return SITE_URL;
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return SITE_URL;
  }
};

/**
 * Normalize an OpenGraph image descriptor: fill in missing dimensions and
 * alt text, absolutize the URL.
 */
export const normalizeImage = (image?: OgImageDescriptor) => {
  const img = image ?? DEFAULT_OG_IMAGE;
  return {
    url: absoluteUrl(img.url),
    width: img.width ?? DEFAULT_OG_IMAGE.width,
    height: img.height ?? DEFAULT_OG_IMAGE.height,
    alt: img.alt ?? DEFAULT_OG_IMAGE.alt,
  };
};

/**
 * Build a normalized canonical path. Always begins with `/`; no trailing
 * slash unless the path is the root.
 */
export const buildCanonical = (path?: string): string => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

/**
 * Truncate a string to a maximum length at the nearest word boundary.
 * Used to keep page titles and meta descriptions inside Google's
 * SERP pixel limits when the source data comes from a CMS without
 * length validation.
 */
export const truncateToLength = (text: string | undefined, max: number): string => {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  // Cut at the last word boundary before `max` so we don't end on a partial word.
  const slice = trimmed.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,.;:!?\-—]+$/, "")}…`;
};

/**
 * Build hreflang alternates for the given path.
 *
 * Returns a `Metadata["alternates"]["languages"]` object that always includes
 * an `x-default` entry pointing at the English variant, plus one entry per
 * supported locale. The keys are BCP-47 locale codes that match the URL
 * structure (e.g. `/en`, `/bn-BD`, `/sv`).
 *
 * Caller passes the *path portion after the locale*, e.g. `buildAlternates("/products/foo", "en")`
 * → `{ en: "/en/products/foo", "bn-BD": "/bn-BD/products/foo", sv: "/sv/products/foo", "x-default": "/en/products/foo" }`.
 */
export const buildAlternates = (
  pathAfterLocale: string,
  locale?: SupportedLocale,
): NonNullable<Metadata["alternates"]>["languages"] => {
  const normalized = pathAfterLocale.startsWith("/")
    ? pathAfterLocale
    : `/${pathAfterLocale}`;
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = `/${loc}${normalized === "/" ? "" : normalized}`;
  }
  languages["x-default"] = languages[locale ?? "en"];
  return languages;
};

/**
 * Build generic page metadata with canonical, hreflang, OpenGraph, and
 * Twitter Card defaults.
 *
 * Pass `locale` for non-default locales so OpenGraph emits the correct
 * `og:locale` and the alternates align with the page's URL.
 */
export const buildPageMetadata = ({
  title,
  description,
  path,
  keywords,
  image,
  noIndex,
  locale,
}: BuildMetadataOptions): Metadata => {
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const canonicalPath = buildCanonical(path);
  const ogImage = normalizeImage(image);
  const inferredLocale: SupportedLocale = locale ?? "en";

  const metadata: Metadata = {
    title,
    description: metaDescription,
    keywords,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: canonicalPath,
      languages: buildAlternates(canonicalPath, inferredLocale),
    },
    openGraph: {
      type: "website",
      siteName: SITE_SHORT_TITLE,
      title,
      description: metaDescription,
      url: absoluteUrl(canonicalPath),
      images: [ogImage],
      locale: OG_LOCALE_MAP[inferredLocale],
      alternateLocale: OG_LOCALE_ALT_MAP[inferredLocale],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      site: SITE_TWITTER_HANDLE,
      creator: SITE_TWITTER_HANDLE,
      images: [ogImage.url],
    },
  };

  return metadata;
};

/**
 * Build article-specific metadata. Extends `buildPageMetadata` with
 * `article`-specific OpenGraph fields.
 */
export const buildArticleMetadata = ({
  title,
  description,
  path,
  keywords,
  image,
  publishedTime,
  modifiedTime,
  authors,
  tags,
  noIndex,
  locale,
}: BuildArticleMetadataOptions): Metadata => {
  const baseMetadata = buildPageMetadata({
    title,
    description,
    path,
    keywords,
    image,
    noIndex,
    locale,
  });

  const normalizedAuthors = authors?.length ? authors : ["RaoFinds"];

  return {
    ...baseMetadata,
    openGraph: {
      ...(baseMetadata.openGraph ?? {}),
      type: "article",
      publishedTime,
      modifiedTime: modifiedTime ?? publishedTime,
      authors: normalizedAuthors,
      tags,
    },
  };
};

/**
 * Build product-specific metadata. Extends `buildPageMetadata` with
 * OpenGraph product pricing and `product:rating:*` extensions.
 */
export const buildProductMetadata = ({
  title,
  description,
  path,
  keywords,
  image,
  price,
  currency,
  availability,
  rating,
  reviewCount,
  noIndex,
  locale,
}: BuildProductMetadataOptions): Metadata => {
  const baseMetadata = buildPageMetadata({
    title,
    description,
    path,
    keywords,
    image,
    noIndex,
    locale,
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...(baseMetadata.openGraph ?? {}),
      type: "website",
      ...(price !== undefined &&
        currency && {
          product: {
            price: price.toString(),
            currency,
            availability:
              availability === "in_stock"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }),
    },
    ...(rating !== undefined && {
      other: {
        "product:rating:value": rating.toString(),
        "product:rating:count": (reviewCount || 1).toString(),
      },
    }),
  } as Metadata;
};
