import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { LocaleCode, BlogPost } from "@/types/domain";
import {
  getBlogCategoryBySlug,
  getBlogPostsByCategory,
  getTrendingBlogPosts,
  getAllActiveCategorySlugs,
} from "@/lib/queries/blog";
import { t } from "@/lib/i18n/translate";
import { formatDate } from "@/lib/i18n/format";

export const revalidate = 3600;

const SUPPORTED_LOCALES: LocaleCode[] = ["en", "bn-BD", "sv"];

export async function generateStaticParams() {
  const slugs = await getAllActiveCategorySlugs();
  const params: { locale: string; slug: string }[] = [];
  for (const slug of slugs) {
    for (const locale of SUPPORTED_LOCALES) {
      const localized = (slug as Record<string, string | undefined>)[locale];
      if (localized) {
        params.push({ locale, slug: localized });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getBlogCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found — RaoFinds" };
  }

  const loc = locale as LocaleCode;
  const name = t(category.name, loc) as string;
  const description =
    (t(category.description, loc) as string) ||
    `Articles in ${name} on RaoFinds.`;

  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const localizedSlug = (
      category.slug as Record<string, string | undefined>
    )[l];
    if (localizedSlug) {
      languages[l] = `/${l}/blog/category/${localizedSlug}`;
    }
  }

  return {
    title: `${name} — RaoFinds Blog`,
    description,
    alternates: { languages },
  };
}

function CategoryBadge({
  color,
  name,
}: {
  color: string | null;
  name: string;
}) {
  const bg = color ?? "#f59e0b";
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
      style={{ backgroundColor: bg }}
    >
      {name}
    </span>
  );
}

function PostCard({
  post,
  locale,
}: {
  post: BlogPost;
  locale: LocaleCode;
}) {
  const title = t(post.title, locale) as string;
  const excerpt = t(post.excerpt, locale) as string;
  const slug = t(post.slug, locale) as string;
  const categoryName = post.blog_categories
    ? (t(post.blog_categories.name, locale) as string)
    : null;
  const categoryColor = post.blog_categories?.color ?? null;
  const dateStr = post.published_at
    ? formatDate(post.published_at, locale)
    : "";

  return (
    <article className="group flex gap-4 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md">
      <div className="relative h-[110px] w-[150px] shrink-0 overflow-hidden rounded-lg bg-surface">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={(t(post.cover_image_alt, locale) as string) || title}
            fill
            sizes="150px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted">
            RaoFinds
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {categoryName && (
            <div className="mb-2">
              <CategoryBadge color={categoryColor} name={categoryName} />
            </div>
          )}
          <Link href={`/blog/${slug}`}>
            <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-brand sm:text-base">
              {title}
            </h2>
          </Link>
          {excerpt && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
              {excerpt}
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="font-medium text-foreground">
            {post.author_name}
          </span>
          {dateStr && <span>{dateStr}</span>}
          {post.read_time_minutes > 0 && (
            <span>{post.read_time_minutes} min read</span>
          )}
        </div>
      </div>
    </article>
  );
}

function TrendingPostCard({
  post,
  index,
  locale,
}: {
  post: BlogPost;
  index: number;
  locale: LocaleCode;
}) {
  const title = t(post.title, locale) as string;
  const slug = t(post.slug, locale) as string;
  const categoryName = post.blog_categories
    ? (t(post.blog_categories.name, locale) as string)
    : null;
  const categoryColor = post.blog_categories?.color ?? null;
  const dateStr = post.published_at
    ? formatDate(post.published_at, locale)
    : "";

  return (
    <Link href={`/blog/${slug}`} className="group flex gap-3 py-3">
      <span className="mt-0.5 shrink-0 text-2xl font-black leading-none text-border">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-muted">
            BF
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {categoryName && (
          <CategoryBadge color={categoryColor} name={categoryName} />
        )}
        <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
          {title}
        </h3>
        <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted">
          {dateStr && <span>{dateStr}</span>}
          {post.read_time_minutes > 0 && (
            <span>{post.read_time_minutes} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as LocaleCode;

  const category = await getBlogCategoryBySlug(slug);
  if (!category) notFound();

  const tBlog = await getTranslations("blog");
  const [posts, trendingPosts] = await Promise.all([
    getBlogPostsByCategory(category.id, 24),
    getTrendingBlogPosts(5),
  ]);

  const name = t(category.name, loc) as string;
  const description = t(category.description, loc) as string;

  return (
    <div>
      {/* Hero Banner */}
      <section
        className="py-12 text-white"
        style={{
          background:
            category.color
              ? `linear-gradient(to right, ${category.color}, ${category.color}cc)`
              : "linear-gradient(to right, #111827, #1f2937)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 text-sm text-white/80"
          >
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  {tBlog("title")}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-white">{name}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{name}</h1>
          {description && (
            <p className="mt-3 max-w-xl text-base text-white/90 sm:text-lg">
              {description}
            </p>
          )}
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <main className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {tBlog("all_articles")}
              </h2>
              <div className="ml-4 h-0.5 flex-1 bg-border" />
            </div>

            {posts.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <p className="text-lg text-muted">{tBlog("no_posts")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} locale={loc} />
                ))}
              </div>
            )}
          </main>

          <aside className="w-full shrink-0 space-y-6 lg:w-80 xl:w-96">
            {trendingPosts.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
                    {tBlog("trending")}
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {trendingPosts.map((post, i) => (
                    <TrendingPostCard
                      key={post.id}
                      post={post}
                      index={i}
                      locale={loc}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
