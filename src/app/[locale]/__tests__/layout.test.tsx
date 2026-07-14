import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Inter: () => ({
    className: "inter-mock",
    style: { fontFamily: "Inter" },
  }),
  Noto_Sans_Bengali: () => ({
    className: "noto-bengali-mock",
    style: { fontFamily: "Noto Sans Bengali" },
  }),
}));

// Mock next-intl
vi.mock("next-intl/server", () => ({
  getMessages: vi.fn().mockResolvedValue({
    common: { site_name: "RaoFinds" },
    nav: { home: "Home" },
    footer: {
      affiliate_disclosure:
        "As an Amazon Associate, we earn from qualifying purchases.",
    },
  }),
  setRequestLocale: vi.fn(),
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({
    children,
    locale,
  }: {
    children: React.ReactNode;
    locale: string;
  }) => (
    <div data-testid="intl-provider" data-locale={locale}>
      {children}
    </div>
  ),
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Mock Header, Footer, and CartProvider since they use client hooks
vi.mock("@/components/Header", () => ({
  default: ({ locale }: { locale: string }) => (
    <header data-testid="header" data-locale={locale}>
      Header
    </header>
  ),
}));

vi.mock("@/components/Footer", () => ({
  default: () => (
    <footer data-testid="footer">
      As an Amazon Associate, we earn from qualifying purchases.
    </footer>
  ),
}));

vi.mock("@/lib/cart/CartProvider", () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="cart-provider">{children}</div>
  ),
}));

import LocaleLayout, { generateMetadata } from "../layout";

// Helper: render the async layout and extract HTML string
async function renderLayout(locale: string, children?: React.ReactNode) {
  const layout = await LocaleLayout({
    children: children ?? <p>Test</p>,
    params: Promise.resolve({ locale }),
  });
  // The layout returns <html>...<body>...</body></html>
  // jsdom strips html/body, so we render the full JSX tree
  // and check the resulting container
  return layout;
}

// Since jsdom merges <html> and <body> into the document,
// we need to use a different approach to test attributes.
// We'll use ReactDOMServer to render to string.
import { renderToString } from "react-dom/server";

async function renderLayoutToString(
  locale: string,
  children?: React.ReactNode
) {
  const layout = await renderLayout(locale, children);
  return renderToString(layout);
}

describe("LocaleLayout", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // TC-1.5.1: Layout renders children
  it("renders children", async () => {
    const html = await renderLayoutToString("en", <p>Test Content</p>);
    expect(html).toContain("Test Content");
  });

  // TC-1.5.2: HTML lang attribute set to 'en'
  it("sets lang=en for English locale", async () => {
    const html = await renderLayoutToString("en");
    expect(html).toContain('lang="en"');
  });

  // TC-1.5.3: HTML lang attribute set to 'bn-BD'
  it("sets lang=bn-BD for Bengali locale", async () => {
    const html = await renderLayoutToString("bn-BD");
    expect(html).toContain('lang="bn-BD"');
  });

  // TC-1.5.4: HTML lang attribute set to 'sv'
  it("sets lang=sv for Swedish locale", async () => {
    const html = await renderLayoutToString("sv");
    expect(html).toContain('lang="sv"');
  });

  // TC-1.5.5: HTML dir attribute is always 'ltr'
  it("sets dir=ltr for all locales", async () => {
    for (const locale of ["en", "bn-BD", "sv"]) {
      const html = await renderLayoutToString(locale);
      expect(html).toContain('dir="ltr"');
    }
  });

  // TC-1.5.6: Inter font applied to all locales
  it("applies font-sans class to all locales", async () => {
    for (const locale of ["en", "bn-BD", "sv"]) {
      const html = await renderLayoutToString(locale);
      expect(html).toContain("font-sans");
    }
  });

  // TC-1.5.7: Bengali locale has increased line-height
  it("applies increased line-height for bn-BD", async () => {
    const html = await renderLayoutToString("bn-BD");
    expect(html).toContain("leading-[1.75]");
  });

  it("does not apply Bengali line-height for en", async () => {
    const html = await renderLayoutToString("en");
    expect(html).not.toContain("leading-[1.75]");
  });

  // TC-1.5.9: NextIntlClientProvider wraps content
  it("wraps content in NextIntlClientProvider", async () => {
    const html = await renderLayoutToString("en", <p>Wrapped</p>);
    expect(html).toContain("intl-provider");
    expect(html).toContain("Wrapped");
  });

  // TC-1.5.10: Layout loads correct message file per locale
  it("passes locale to NextIntlClientProvider", async () => {
    const html = await renderLayoutToString("bn-BD");
    expect(html).toContain('data-locale="bn-BD"');
  });

  // TC-1.5.13: Affiliate disclosure text present
  it("renders affiliate disclosure", async () => {
    const html = await renderLayoutToString("en");
    expect(html).toContain(
      "As an Amazon Associate, we earn from qualifying purchases"
    );
  });

  // TC-1.5.14: Affiliate disclosure present in all locales
  it("renders affiliate disclosure for all locales", async () => {
    for (const locale of ["en", "bn-BD", "sv"]) {
      const html = await renderLayoutToString(locale);
      expect(html).toContain("Amazon Associate");
    }
  });

  // TC-1.5.15: Layout handles empty children
  it("renders without crashing with null children", async () => {
    const html = await renderLayoutToString(
      "en",
      null as unknown as React.ReactNode
    );
    expect(html).toContain('lang="en"');
  });

  // TC-1.5.17: Layout with deeply nested children
  it("renders deeply nested children", async () => {
    const nested = (
      <div>
        <div>
          <div>
            <div>
              <div>Deep</div>
            </div>
          </div>
        </div>
      </div>
    );
    const html = await renderLayoutToString("en", nested);
    expect(html).toContain("Deep");
  });

  // TC-1.5.18: Invalid locale parameter
  it("calls notFound for invalid locale", async () => {
    const { notFound } = await import("next/navigation");
    await renderLayout("fr");
    expect(notFound).toHaveBeenCalled();
  });
});

// TC-1.5.11: Default metadata title template
describe("generateMetadata", () => {
  it("returns title template", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(metadata.title).toEqual(
      expect.objectContaining({
        template: expect.stringContaining("RaoFinds"),
        default: expect.any(String),
      })
    );
  });

  // TC-1.5.12: Metadata description varies by locale
  it("returns locale-specific description", async () => {
    const enMeta = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    const bnMeta = await generateMetadata({
      params: Promise.resolve({ locale: "bn-BD" }),
    });
    expect(enMeta.description).toBeDefined();
    expect(bnMeta.description).toBeDefined();
    expect(enMeta.description).not.toBe(bnMeta.description);
  });

  // TC-1.5.20: NEXT_PUBLIC_SITE_URL not set → fall back to the default
  // SITE_URL from seo-config so metadataBase is always defined. Previously
  // this asserted metadataBase === undefined; the new behavior is required
  // so that canonical URLs and og:url resolve correctly even when the
  // deployment forgot to set the env var.
  it("falls back to default SITE_URL when NEXT_PUBLIC_SITE_URL is missing", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.metadataBase?.toString()).toMatch(/^https:\/\//);
    process.env.NEXT_PUBLIC_SITE_URL = originalUrl;
  });
});
