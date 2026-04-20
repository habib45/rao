import type { LocaleCode, TranslationMap } from "@/types/domain";

export function t<T>(
  map: TranslationMap<T> | undefined | null,
  locale: LocaleCode
): T | string {
  if (!map) return "";
  return map[locale] ?? map["en"] ?? "";
}
