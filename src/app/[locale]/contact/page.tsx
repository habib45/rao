import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { LocaleCode } from "@/types/domain";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as LocaleCode);
  const t = await getTranslations("contact");

  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact RaoFinds",
    description: "Get in touch with RaoFinds for questions, feedback, or support.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/contact`,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-lg text-foreground/70">{t("subtitle")}</p>
      </div>

      <div className="space-y-8">
        {/* Contact Information */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground">{t("contact_info")}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("email")}</p>
                <a
                  href="mailto:contact@raofinds.com"
                  className="text-foreground/70 hover:text-brand transition-colors"
                >
                  contact@raofinds.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("response_time")}</p>
                <p className="text-foreground/70">{t("response_time_value")}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("location")}</p>
                <p className="text-foreground/70">{t("location_value")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground">{t("send_message")}</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                {t("name")}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                {t("email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
                {t("subject")}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                {t("message")}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              {t("send")}
            </button>
          </form>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-6 text-xl font-semibold text-foreground">{t("faq_title")}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium text-foreground">{t("faq_1_q")}</h3>
              <p className="text-foreground/70">{t("faq_1_a")}</p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-foreground">{t("faq_2_q")}</h3>
              <p className="text-foreground/70">{t("faq_2_a")}</p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-foreground">{t("faq_3_q")}</h3>
              <p className="text-foreground/70">{t("faq_3_a")}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
