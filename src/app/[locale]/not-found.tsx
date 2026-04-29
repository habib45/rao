import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-lg text-muted">Page not found</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
