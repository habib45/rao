import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { LocaleCode } from "@/types/domain";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart/CartProvider";
import { ComparisonProvider } from "@/lib/comparison/index";
import { JsonLd, organizationJsonLd, websiteJsonLd, appleItunesAppMeta } from "@/components/JsonLd";
import {
  SITE_URL,
  SITE_SHORT_TITLE,
  VERIFICATION_CODES,
  buildAlternatesFromConfig,
} from "@/lib/seo-config";
import "../globals.css";

const locales: LocaleCode[] = ["en", "bn-BD", "sv"];

const descriptions: Record<LocaleCode, string> = {
  en: "Shop the best Amazon products with expert reviews, comparisons & deals. Find trusted products at unbeatable prices. Start saving today!",
  "bn-BD":
    "Amazon-এ সেরা পণ্য খুঁজুন — বিশেষজ্ঞ রিভিউ, তুলনা ও ডিল। বিশ্বস্ত পণ্য সেরা দামে পান। আজই সাশ্রয় শুরু করুন!",
  sv: "Hitta de bästa Amazon-produkterna med expertrecensioner, jämförelser & erbjudanden. Hitta pålitliga produkter till oslagbara priser. Spara nu!",
};

/**
 * Filter the verification codes object down to entries with non-empty values
 * so the layout doesn't render `<meta name="..." content="">` for unset codes.
 */
const activeVerificationCodes = Object.fromEntries(
  Object.entries(VERIFICATION_CODES).filter(([, value]) => Boolean(value)),
) as Partial<Record<keyof typeof VERIFICATION_CODES, string>>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as LocaleCode;

  return {
    title: {
      template: "%s | RaoFinds",
      default: "RaoFinds — Best Products on Amazon",
    },
    description: descriptions[loc] ?? descriptions.en,
    keywords: [
      "Amazon products",
      "product reviews",
      "best deals",
      "online shopping",
      "product comparisons",
      "affiliate",
      "RaoFinds",
    ],
    authors: [{ name: SITE_SHORT_TITLE, url: SITE_URL }],
    publisher: SITE_SHORT_TITLE,
    metadataBase: new URL(SITE_URL),
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.json",
    appleWebApp: {
      title: SITE_SHORT_TITLE,
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      siteName: SITE_SHORT_TITLE,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${SITE_SHORT_TITLE} - Best Products on Amazon`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@raofinds",
      creator: "@raofinds",
    },
    alternates: {
      canonical: `/${loc}`,
      languages: buildAlternatesFromConfig("/"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as LocaleCode)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const bodyClassName = locale === "bn-BD" ? "leading-[1.75]" : "";

  // Map our config keys to the conventional meta-name attribute values each
  // webmaster tool expects. Anything not set is filtered out above.
  const verificationMetaNames: Record<keyof typeof activeVerificationCodes, string> = {
    google: "google-site-verification",
    bing: "msvalidate.01",
    yandex: "yandex-verification",
    apple: "apple-itunes-app",
    microsoft: "msvalidate.01",
    baidu: "baidu-site-verification",
    pinterest: "p:domain_verify",
    facebookDomain: "facebook-domain-verification",
    norton: "norton-dc-token",
  };
  const itunesAppMeta = appleItunesAppMeta();

  return (
    <html lang={locale} dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f59e0b" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-title" content={SITE_SHORT_TITLE} />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd(locale as LocaleCode)} />
        {Object.entries(activeVerificationCodes).map(([key, value]) => (
          <meta
            key={key}
            name={verificationMetaNames[key as keyof typeof activeVerificationCodes]}
            content={value}
          />
        ))}
        {itunesAppMeta && <meta name="apple-itunes-app" content={itunesAppMeta} />}
      </head>
      <body className={`${bodyClassName} min-h-screen flex flex-col font-sans antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <ComparisonProvider>
              <Header locale={locale as LocaleCode} />
              <main className="flex-1" id="main-content" tabIndex={-1}>{children}</main>
              <Footer />
            </ComparisonProvider>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
