import type { LocaleCode } from "@/types/domain";

const localeMap: Record<LocaleCode, string> = {
  en: "en-US",
  "bn-BD": "bn-BD",
  sv: "sv-SE",
};

export function formatDate(
  dateStr: string,
  locale: string,
  month: "short" | "long" = "short",
): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month,
    day: "numeric",
  });
}

export function formatPrice(
  cents: number | null,
  currency: string = "USD",
  locale: LocaleCode
): string {
  if (cents === null || cents === undefined) return "";
  return new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency,
    numberingSystem: "latn",
  }).format(cents / 100);
}
