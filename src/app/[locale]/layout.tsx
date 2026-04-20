import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { LocaleCode } from "@/types/domain";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  display: "swap",
});

const locales: LocaleCode[] = ["en", "bn-BD", "sv"];

const descriptions: Record<LocaleCode, string> = {
  en: "Discover the best products on Amazon — curated deals, reviews, and comparisons.",
  "bn-BD":
    "Amazon-এ সেরা পণ্য খুঁজুন — নির্বাচিত ডিল, রিভিউ এবং তুলনা।",
  sv: "Upptäck de bästa produkterna på Amazon — utvalda erbjudanden, recensioner och jämförelser.",
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
      template: "%s | BestFinds",
      default: "BestFinds — Best Products on Amazon",
    },
    description: descriptions[loc] ?? descriptions.en,
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
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

  const isBengali = locale === "bn-BD";
  const bodyClassName = isBengali
    ? `${inter.className} ${notoSansBengali.className} leading-[1.75]`
    : inter.className;

  return (
    <html lang={locale} dir="ltr">
      <body className={bodyClassName}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <footer className="text-center text-sm text-gray-500 py-4">
            As an Amazon Associate, we earn from qualifying purchases.
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
