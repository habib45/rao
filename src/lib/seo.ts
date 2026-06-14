import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://raofinds.com";
const SITE_SHORT_TITLE = "RaoFinds";
const DEFAULT_DESCRIPTION = "Shop the best Amazon products with expert reviews, comparisons & deals. Find trusted products at unbeatable prices. Start saving today!";
const DEFAULT_TWITTER = "@raofinds";

const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "RaoFinds - Best Products on Amazon",
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
 * Convert relative path to absolute URL
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
 * Normalize image with default dimensions and alt text
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
 * Build canonical path
 */
export const buildCanonical = (path?: string): string => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

/**
 * Build generic page metadata
 */
export const buildPageMetadata = ({
  title,
  description,
  path,
  keywords,
  image,
  noIndex,
}: BuildMetadataOptions): Metadata => {
  const metaDescription = description ?? DEFAULT_DESCRIPTION;
  const canonicalPath = buildCanonical(path);
  const ogImage = normalizeImage(image);

  const metadata: Metadata = {
    title,
    description: metaDescription,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      siteName: SITE_SHORT_TITLE,
      title,
      description: metaDescription,
      url: absoluteUrl(canonicalPath),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      site: DEFAULT_TWITTER,
      creator: DEFAULT_TWITTER,
      images: [ogImage.url],
    },
  };

  if (typeof noIndex === "boolean") {
    metadata.robots = {
      index: !noIndex,
      follow: !noIndex,
    };
  }

  return metadata;
};

/**
 * Build article-specific metadata
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
}: BuildArticleMetadataOptions): Metadata => {
  const baseMetadata = buildPageMetadata({
    title,
    description,
    path,
    keywords,
    image,
    noIndex,
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
 * Build product-specific metadata
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
}: BuildProductMetadataOptions): Metadata => {
  const baseMetadata = buildPageMetadata({
    title,
    description,
    path,
    keywords,
    image,
    noIndex,
  });

  const canonicalPath = buildCanonical(path);
  const absoluteCanonical = absoluteUrl(canonicalPath);

  return {
    ...baseMetadata,
    openGraph: {
      ...(baseMetadata.openGraph ?? {}),
      type: "website",
      ...(price && currency && {
        product: {
          price: price.toString(),
          currency,
          availability: availability === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      }),
    },
    ...(rating && {
      other: {
        "product:rating:value": rating.toString(),
        "product:rating:count": (reviewCount || 1).toString(),
      },
    }),
  } as Metadata;
};
