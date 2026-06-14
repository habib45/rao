import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { LocaleCode } from "@/types/domain";

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutUs" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as LocaleCode);
  const t = await getTranslations("aboutUs");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RaoFinds",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/icon.svg`,
    description: "Shop the best Amazon products with expert reviews, comparisons & deals.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@raofinds.com",
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <h1 className="mb-4 text-3xl font-bold text-foreground">{t("title")}</h1>
      <p className="mb-12 text-lg leading-relaxed text-foreground/70">{t("intro")}</p>

      <div className="space-y-10">
        {/* Mission */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-xl font-semibold text-foreground">{t("mission_title")}</h2>
          <p className="leading-relaxed text-foreground/70">{t("mission_body")}</p>
        </section>

        {/* How we pick */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-xl font-semibold text-foreground">{t("how_title")}</h2>
          <p className="leading-relaxed text-foreground/70">{t("how_body")}</p>
        </section>

        {/* Trust signals */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">{t("trust_title")}</h2>
          <ul className="space-y-3">
            {(["trust_1", "trust_2", "trust_3", "trust_4"] as const).map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  ✓
                </span>
                <span className="text-foreground/70">{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Editorial independence */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-xl font-semibold text-foreground">{t("editorial_title")}</h2>
          <p className="leading-relaxed text-foreground/70">{t("editorial_body")}</p>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h2 className="mb-3 text-xl font-semibold text-foreground">{t("contact_title")}</h2>
          <p className="mb-3 leading-relaxed text-foreground/70">{t("contact_body")}</p>
          <a
            href={`mailto:${t("contact_email")}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {t("contact_email")}
          </a>
        </section>

        {/* Trust badges */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Trust & Security</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-foreground">SSL Secured</p>
                <p className="text-sm text-foreground/70">256-bit encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-foreground">Amazon Associate</p>
                <p className="text-sm text-foreground/70">Verified partner</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
