import type { ReactElement } from "react";
import {
  APPLE_ITUNES_APP,
  SITE_SHORT_TITLE,
  SITE_URL,
  SOCIAL_PROFILES,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/seo-config";

/**
 * Single shared server component that renders a JSON-LD `<script>` tag for
 * a schema.org object. All inline JSON-LD on the site routes through this
 * helper so the script-tag wrapping, escaping, and `dangerouslySetInnerHTML`
 * pattern stays in one place.
 *
 * For specialized FAQ JSON-LD, use `FAQSchema` from
 * `@/components/schema/FAQSchema`, which accepts a typed FAQ list and
 * produces a `FAQPage` schema object directly.
 */

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

type JsonLdProps = {
  /**
   * The schema.org object to serialize. The component wraps it with
   * `"@context": "https://schema.org"` automatically if one is not present.
   */
  data: Record<string, JsonLdValue>;
  /**
   * Optional id to attach to the rendered `<script>` tag. Useful when
   * multiple JSON-LD blocks live on the same page and tests need to pick
   * a specific one. Defaults to `"jsonld-{@type}"`.
   */
  id?: string;
};

/**
 * Escape characters that would break out of the inline `<script>` tag.
 *
 * The only character that genuinely matters in JSON is `</`, since
 * `</script>` would terminate the script tag. Other JSON special chars
 * (`"`, `\`) are safe inside `<script type="application/ld+json">` because
 * the script content is a CDATA-like raw text node, not an HTML attribute.
 *
 * Even so, we still escape backslashes and forward slashes for belt-and-
 * braces safety against parsers that attempt to be clever.
 */
const escapeScriptContent = (json: string): string =>
  json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

export function JsonLd({ data, id }: JsonLdProps): ReactElement {
  const schema = data["@context"]
    ? data
    : { "@context": "https://schema.org", ...data };

  const scriptId = id ?? `jsonld-${String(schema["@type"] ?? "item").toLowerCase()}`;

  return (
    <script
      type="application/ld+json"
      id={scriptId}
      dangerouslySetInnerHTML={{ __html: escapeScriptContent(JSON.stringify(schema)) }}
    />
  );
}

/**
 * Build an Organization JSON-LD object. Mirrors the structured data Google
 * uses to surface site-name sitelinks and the knowledge panel.
 *
 * Use via `<JsonLd data={organizationJsonLd()} />`.
 */
export function organizationJsonLd(): Record<string, JsonLdValue> {
  const sameAs = [
    SOCIAL_PROFILES.twitter,
    SOCIAL_PROFILES.facebook,
    SOCIAL_PROFILES.linkedin,
    SOCIAL_PROFILES.youtube,
    SOCIAL_PROFILES.instagram,
    SOCIAL_PROFILES.pinterest,
  ].filter((url): url is string => Boolean(url));

  return {
    "@type": "Organization",
    name: SITE_SHORT_TITLE,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      "Shop the best Amazon products with expert reviews, comparisons & deals.",
    ...(sameAs.length > 0 && { sameAs }),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@raofinds.com",
    },
  };
}

/**
 * Build a WebSite JSON-LD object with a SearchAction `potentialAction`.
 * This is what enables Google's sitelinks searchbox.
 *
 * The search target uses `/{locale}/search?q={search_term_string}` so the
 * URL is locale-aware and the search route can read the query from a single
 * parameter.
 */
export function websiteJsonLd(locale?: SupportedLocale): Record<string, JsonLdValue> {
  const fallbackLocale = locale ?? SUPPORTED_LOCALES[0];
  return {
    "@type": "WebSite",
    name: SITE_SHORT_TITLE,
    url: SITE_URL,
    inLanguage: [...SUPPORTED_LOCALES],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${fallbackLocale}/search?q={search_term_string}`,
      },
      // `query-input` is required by Google's documentation for the sitelinks
      // searchbox. The value must be the literal string `required name=...`.
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Build a BreadcrumbList JSON-LD object.
 *
 * Use via `<JsonLd data={breadcrumbJsonLd(items)} />` where `items` is an
 * array of `{ name, item }` pairs. The `item` URLs may be absolute or
 * relative; the helper does not normalize them.
 */
export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; item: string }>,
): Record<string, JsonLdValue> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

/**
 * Apple iTunes app smart-app-banner metadata, if configured.
 *
 * Returns `null` when no app id is set so the caller can skip rendering the
 * meta tag entirely.
 */
export function appleItunesAppMeta(): string | null {
  if (!APPLE_ITUNES_APP.appId) return null;
  const parts = [`app-id=${APPLE_ITUNES_APP.appId}`];
  if (APPLE_ITUNES_APP.affiliateData) {
    parts.push(`affiliate-data=${APPLE_ITUNES_APP.affiliateData}`);
  }
  if (APPLE_ITUNES_APP.argument) {
    parts.push(`app-argument=${APPLE_ITUNES_APP.argument}`);
  }
  return parts.join(", ");
}
