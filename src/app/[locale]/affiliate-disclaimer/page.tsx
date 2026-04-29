import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { LocaleCode } from "@/types/domain";

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "affiliateDisclaimer" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function AffiliateDisclaimerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as LocaleCode);
  const t = await getTranslations("affiliateDisclaimer");

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">{t("title")}</h1>

      <div className="prose prose-lg max-w-none space-y-6 text-foreground/80">
        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("amazon_program_title")}</h2>
          <p>{t("amazon_program_body")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("compensation_title")}</h2>
          <p>{t("compensation_body")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("honesty_title")}</h2>
          <p>{t("honesty_body")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("price_disclaimer_title")}</h2>
          <p>{t("price_disclaimer_body")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">{t("contact_title")}</h2>
          <p>{t("contact_body")}</p>
        </section>

        <p className="mt-8 text-sm text-foreground/50">{t("last_updated")}</p>
      </div>
    </main>
  );
}
