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

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
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
      </div>
    </main>
  );
}
