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
import "../globals.css";

const locales: LocaleCode[] = ["en", "bn-BD", "sv"];

const descriptions: Record<LocaleCode, string> = {
  en: "Shop the best Amazon products with expert reviews, comparisons & deals. Find trusted products at unbeatable prices. Start saving today!",
  "bn-BD":
    "Amazon-এ সেরা পণ্য খুঁজুন — বিশেষজ্ঞ রিভিউ, তুলনা ও ডিল। বিশ্বস্ত পণ্য সেরা দামে পান। আজই সাশ্রয় শুরু করুন!",
  sv: "Hitta de bästa Amazon-produkterna med expertrecensioner, jämförelser & erbjudanden. Hitta pålitliga produkter till oslagbara priser. Spara nu!",
};

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
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${loc}`,
      languages: {
        en: "/en",
        "bn-BD": "/bn-BD",
        sv: "/sv",
      },
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

  return (
    <html lang={locale} dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f59e0b" />
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
