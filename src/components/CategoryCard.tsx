import Image from "next/image";
import { Link } from "@/i18n/routing";
import type { Category, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";

export default function CategoryCard({
  category,
  locale,
}: {
  category: Category;
  locale: LocaleCode;
}) {
  const name = t(category.name, locale) as string;
  const slug = t(category.slug, locale) as string;

  return (
    <Link
      href={`/categories/${slug}`}
      className="group block rounded-lg border border-border bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-surface">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            {name}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
          {name}
        </h3>
        {t(category.description, locale) && (
          <p className="mt-1 text-xs text-muted line-clamp-2">
            {t(category.description, locale) as string}
          </p>
        )}
      </div>
    </Link>
  );
}
