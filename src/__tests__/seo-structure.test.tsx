/**
 * SEO structure verification — Phase 22 international SEO standards.
 *
 * These tests cover the *shape* of SEO outputs that the build helpers
 * produce. They do not render the full Next.js App Router tree (the page
 * components depend on `next-intl/server` and DB queries that require a
 * network); instead they exercise the leaf helpers and shared components
 * directly so regressions in hreflang, OG locale, and JSON-LD shape are
 * caught at unit-test time.
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildPageMetadata,
  buildAlternates,
  absoluteUrl,
  normalizeImage,
} from "@/lib/seo";
import {
  SITE_URL,
  SITE_SHORT_TITLE,
  SUPPORTED_LOCALES,
  buildAlternatesFromConfig,
} from "@/lib/seo-config";
import {
  JsonLd,
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  appleItunesAppMeta,
} from "@/components/JsonLd";

describe("buildAlternates (seo.ts)", () => {
  it("always emits every supported locale plus an x-default", () => {
    const alts = buildAlternates("/products/foo", "en") as Record<string, string>;
    for (const loc of SUPPORTED_LOCALES) {
      expect(alts[loc]).toBe(`/${loc}/products/foo`);
    }
    expect(alts["x-default"]).toBe("/en/products/foo");
  });

  it("uses the caller-supplied locale for x-default", () => {
    const alts = buildAlternates("/", "sv") as Record<string, string>;
    expect(alts["x-default"]).toBe("/sv");
    expect(alts.en).toBe("/en");
  });

  it("normalizes a path without a leading slash", () => {
    const alts = buildAlternates("blog/post-1", "en") as Record<string, string>;
    expect(alts.en).toBe("/en/blog/post-1");
  });
});

describe("buildAlternatesFromConfig (seo-config.ts)", () => {
  it("mirrors buildAlternates output for the root path", () => {
    const fromConfig = buildAlternatesFromConfig("/");
    const fromSeo = buildAlternates("/", "en");
    expect(fromConfig).toEqual(fromSeo);
  });

  it("emits one entry per supported locale and an x-default", () => {
    const alts = buildAlternatesFromConfig("/blog", "en");
    expect(Object.keys(alts).sort()).toEqual(
      ["bn-BD", "en", "sv", "x-default"].sort(),
    );
  });
});

describe("buildPageMetadata", () => {
  it("returns a canonical relative path resolved against metadataBase", () => {
    const meta = buildPageMetadata({
      title: "Test Page",
      description: "Test description",
      path: "/products/foo",
      locale: "en",
    });
    // canonical is a relative path; the framework resolves it against
    // metadataBase (set in the locale layout) at render time.
    expect(meta.alternates?.canonical).toBe("/products/foo");
  });

  it("emits hreflang x-default plus every supported locale", () => {
    const meta = buildPageMetadata({
      title: "Test",
      path: "/products/foo",
      locale: "en",
    });
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages["x-default"]).toBe("/en/products/foo");
    expect(languages.en).toBe("/en/products/foo");
    expect(languages["bn-BD"]).toBe("/bn-BD/products/foo");
    expect(languages.sv).toBe("/sv/products/foo");
  });

  it("populates OpenGraph locale and alternateLocale", () => {
    const meta = buildPageMetadata({
      title: "Test",
      path: "/",
      locale: "bn-BD",
    });
    expect(meta.openGraph?.locale).toBe("bn_BD");
    // alternateLocale should include the *other* locales — never the page's
    // own locale (otherwise crawlers see a self-referential alternate).
    const alt = meta.openGraph?.alternateLocale as string[] | undefined;
    expect(alt).toBeDefined();
    expect(alt).not.toContain("bn_BD");
    expect(alt).toEqual(expect.arrayContaining(["en_US", "sv_SE"]));
  });

  it("absolutizes the canonical URL for og:url", () => {
    const meta = buildPageMetadata({
      title: "Test",
      path: "/products/foo",
      locale: "en",
    });
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/products/foo`);
  });
});

describe("absoluteUrl + normalizeImage", () => {
  it("absoluteUrl passes through absolute URLs", () => {
    expect(absoluteUrl("https://other.example/x")).toBe(
      "https://other.example/x",
    );
  });

  it("absoluteUrl resolves relative paths against SITE_URL", () => {
    expect(absoluteUrl("/foo.png")).toBe(`${SITE_URL}/foo.png`);
  });

  it("normalizeImage falls back to DEFAULT_OG_IMAGE dimensions", () => {
    const img = normalizeImage({ url: "/x.png", alt: "x" });
    expect(img.url).toBe(`${SITE_URL}/x.png`);
    expect(typeof img.width).toBe("number");
    expect(typeof img.height).toBe("number");
    expect(img.alt).toBe("x");
  });
});

describe("JsonLd component", () => {
  it("renders a single application/ld+json script", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ "@type": "Thing", a: 1 }} />);
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Thing"');
    expect(html).toContain('"a":1');
  });

  it("escapes </script> sequences per the HTML-in-script spec", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ "@type": "Thing", x: "</script><script>alert(1)</script>" }} />,
    );
    // The dangerous close-tag must be escaped; no literal "</script>" should
    // appear inside the JSON payload.
    expect(html).not.toContain("</script><script>alert(1)</script>");
    expect(html).toContain("\\u003c");
  });
});

describe("organizationJsonLd + websiteJsonLd shape", () => {
  it("organizationJsonLd identifies an Organization at SITE_URL", () => {
    const data = organizationJsonLd();
    // `@context` is intentionally omitted — the JsonLd component auto-
    // injects it. Test the raw helper contract.
    expect(data["@type"]).toBe("Organization");
    expect(data.url).toBe(SITE_URL);
    expect(data.logo).toBe(`${SITE_URL}/icon.svg`);
    expect(data.name).toBe(SITE_SHORT_TITLE);
    if (data.sameAs !== undefined) {
      expect(Array.isArray(data.sameAs)).toBe(true);
    }
  });

  it("websiteJsonLd includes a SearchAction with the locale search route", () => {
    const data = websiteJsonLd("sv") as unknown as Record<string, unknown>;
    expect(data["@type"]).toBe("WebSite");
    expect(data.inLanguage).toEqual(expect.arrayContaining(["en", "bn-BD", "sv"]));
    const action = data.potentialAction as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
    const target = action.target as Record<string, unknown>;
    expect(target.urlTemplate).toBe(
      `${SITE_URL}/sv/search?q={search_term_string}`,
    );
    expect(action["query-input"]).toBe("required name=search_term_string");
  });

  it("breadcrumbJsonLd produces a valid BreadcrumbList", () => {
    const data = breadcrumbJsonLd([
      { name: "Home", item: "/" },
      { name: "Products", item: "/products" },
    ]) as unknown as Record<string, unknown>;
    expect(data["@type"]).toBe("BreadcrumbList");
    const items = data.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
  });
});

describe("appleItunesAppMeta", () => {
  it("returns null when no app id is configured", () => {
    // seo-config reads NEXT_PUBLIC_APPLE_ITUNES_APP_ID at module load. In a
    // test environment that env var is unset, so this must be null and the
    // layout must therefore omit the meta tag.
    if (!process.env.NEXT_PUBLIC_APPLE_ITUNES_APP_ID) {
      expect(appleItunesAppMeta()).toBeNull();
    } else {
      expect(appleItunesAppMeta()).toMatch(/^app-id=/);
    }
  });
});