import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@/types/domain";
import type { SupportedLocale } from "@/lib/seo-config";
import { getActiveCategories } from "@/lib/queries/categories";
import CategoryCard from "@/components/CategoryCard";
import { buildPageMetadata } from "@/lib/seo";

const titles: Record<SupportedLocale, string> = {
  en: "All Categories — Browse Curated Amazon Deals",
  "bn-BD": "সব বিভাগ — নির্বাচিত Amazon ডিল দেখুন",
  sv: "Alla kategorier — Bläddra bland utvalda Amazon-erbjudanden",
};
const descriptions: Record<SupportedLocale, string> = {
  en: "Browse all product categories on RaoFinds — find curated Amazon deals, expert reviews, and side-by-side comparisons across kitchen, tech, home, and more.",
  "bn-BD": "RaoFinds-এ সব পণ্যের বিভাগ দেখুন — রান্নাঘর, প্রযুক্তি, বাড়ি এবং আরও অনেক কিছুতে নির্বাচিত Amazon ডিল, বিশেষজ্ঞ রিভিউ ও তুলনা খুঁজুন।",
  sv: "Bläddra bland alla produktkategorier på RaoFinds — hitta utvalda Amazon-erbjudanden, expertrecensioner och jämförelser inom kök, teknik, hem med mera.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale as SupportedLocale) ?? "en";
  return buildPageMetadata({
    title: titles[loc] ?? titles.en,
    description: descriptions[loc] ?? descriptions.en,
    path: `/${locale}/categories`,
    locale: loc,
  });
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const categories = await getActiveCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {t("categories")}
      </h1>

      {categories.length === 0 ? (
        <p className="text-muted">No categories found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              locale={loc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
