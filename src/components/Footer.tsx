import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tAbout = useTranslations("aboutUs");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-brand">
              {tCommon("site_name")}
            </h3>
            <p className="text-sm leading-relaxed text-white/70">
              {t("affiliate_disclosure")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-brand">
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="transition-colors hover:text-brand"
                >
                  {tNav("categories")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="transition-colors hover:text-brand"
                >
                  {tNav("search")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="transition-colors hover:text-brand"
                >
                  {tNav("cart")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-brand"
                >
                  {tAbout("title")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>{t("privacy_policy")}</li>
              <li>{t("terms")}</li>
              <li>
                <Link
                  href="/affiliate-disclaimer"
                  className="transition-colors hover:text-brand"
                >
                  {t("affiliate_disclaimer")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="mb-4 font-semibold">Follow Us</h4>
            <div className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M22 12a10 10 0 1 0-11.563 9.875v-6.988H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.461h-1.261c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33v6.988A10.002 10.002 0 0 0 22 12Z" />
                </svg>
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M19.633 7.997c.013.176.013.353.013.53 0 5.403-4.113 11.63-11.63 11.63-2.316 0-4.47-.675-6.283-1.838.325.037.638.05.975.05a8.205 8.205 0 0 0 5.088-1.75 4.105 4.105 0 0 1-3.83-2.844c.25.037.5.063.763.063.362 0 .725-.05 1.062-.138a4.098 4.098 0 0 1-3.287-4.02v-.05c.55.305 1.188.493 1.862.518a4.096 4.096 0 0 1-1.27-5.476 11.65 11.65 0 0 0 8.45 4.287 4.627 4.627 0 0 1-.1-.938 4.095 4.095 0 0 1 7.088-2.8 8.063 8.063 0 0 0 2.6-.99 4.085 4.085 0 0 1-1.8 2.263 8.22 8.22 0 0 0 2.363-.638 8.804 8.804 0 0 1-2.063 2.138Z" />
                </svg>
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.77 1.69 4.92 4.92.057 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.15 3.225-1.666 4.77-4.92 4.918-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.15-4.77-1.698-4.92-4.92-.057-1.266-.07-1.645-.07-4.85s.013-3.584.07-4.85c.15-3.227 1.666-4.77 4.92-4.92C8.415 2.175 8.795 2.163 12 2.163Zm0 5.838a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.25-.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {year} {tCommon("site_name")}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
