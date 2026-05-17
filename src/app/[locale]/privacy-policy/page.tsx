import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { LocaleCode } from "@/types/domain";
import { Shield, Lock, Cookie, Eye, UserCheck, AlertCircle, FileText, Mail } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacyPolicy" });

  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as LocaleCode);
  const t = await getTranslations("privacyPolicy");

  const sections = [
    { icon: Shield, title: "intro_title", body: "intro_body" },
    { icon: FileText, title: "info_collection_title", body: "info_collection_body" },
    { icon: Eye, title: "info_usage_title", body: "info_usage_body" },
    { icon: Cookie, title: "cookies_title", body: "cookies_body" },
    { icon: Lock, title: "data_security_title", body: "data_security_body" },
    { icon: UserCheck, title: "user_rights_title", body: "user_rights_body" },
    { icon: AlertCircle, title: "children_privacy_title", body: "children_privacy_body" },
    { icon: FileText, title: "changes_title", body: "changes_body" },
    { icon: Mail, title: "contact_title", body: "contact_body", email: true },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("last_updated")}</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={index}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3 text-xl font-semibold text-foreground">
                    {t(section.title)}
                  </h2>
                  <p className="leading-relaxed text-muted-foreground">
                    {t(section.body)}
                  </p>
                  {section.email && (
                    <p className="mt-3 font-semibold text-foreground">
                      {t("contact_email")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-xl bg-brand/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{t("title")}</strong> —{" "}
          {t("intro_body")}
        </p>
      </div>
    </div>
  );
}
