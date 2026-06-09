"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import type { LocaleCode } from "@/types/domain";
import { useCart } from "@/lib/cart/CartProvider";
import SearchBar from "@/components/SearchBar";

const locales: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "bn-BD", label: "বাংলা" },
  { code: "sv", label: "SV" },
];

export default function Header({ locale }: { locale: LocaleCode }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { count: cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
      <script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="Rj/OXwrCVvFKc3tAWJnNzg"
        async
      ></script>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 text-xl font-bold text-brand" aria-label={`${tCommon("site_name")} - Home`}>
            {tCommon("site_name")}
          </Link>

          {/* Search (desktop) */}
          <div className="hidden flex-1 justify-center md:flex">
            <SearchBar />
          </div>

          {/* Right-side nav */}
          <div className="flex items-center gap-3 md:gap-5">
            <nav className="hidden items-center gap-5 md:flex" aria-label="Main navigation">
              <Link
                href="/"
                className="text-sm font-medium text-foreground transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
              >
                {t("home")}
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-foreground transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
              >
                {t("products")}
              </Link>
              <Link
                href="/categories"
                className="text-sm font-medium text-foreground transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
              >
                {t("categories")}
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-foreground transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
              >
                {t("blog")}
              </Link>
            </nav>

            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center rounded-full p-2 text-foreground transition-colors hover:bg-surface hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              aria-label={`${t("cart")} (${cartCount} items)`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white" aria-label={`${cartCount} items in cart`}>
                  {cartCount}
                </span>
              )}
            </Link>

            <select
              value={locale}
              onChange={(e) => {
                router.replace(pathname, {
                  locale: e.target.value as LocaleCode,
                });
              }}
              className="rounded-md border border-border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              aria-label="Select language"
            >
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <SearchBar />
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-4 overflow-x-auto pb-3 md:hidden" aria-label="Mobile navigation">
          <Link
            href="/"
            className="whitespace-nowrap text-sm font-medium text-foreground hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            {t("home")}
          </Link>
          <Link
            href="/products"
            className="whitespace-nowrap text-sm font-medium text-foreground hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            {t("products")}
          </Link>
          <Link
            href="/categories"
            className="whitespace-nowrap text-sm font-medium text-foreground hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            {t("categories")}
          </Link>
          <Link
            href="/blog"
            className="whitespace-nowrap text-sm font-medium text-foreground hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            {t("blog")}
          </Link>
          <Link
            href="/search"
            className="whitespace-nowrap text-sm font-medium text-foreground hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded"
          >
            {t("search")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
