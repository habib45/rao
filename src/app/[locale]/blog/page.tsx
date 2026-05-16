import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { LocaleCode, BlogPost, BlogCategory } from "@/types/domain";
import {
  getPublishedBlogPosts,
  getTrendingBlogPosts,
  getActiveBlogCategories,
  getFeaturedBlogPosts,
  getPublishedBlogPostsCount,
} from "@/lib/queries/blog";
import { t } from "@/lib/i18n/translate";
import { formatDate } from "@/lib/i18n/format";
import { BlogFilters } from "./_components/BlogFilters";
import { PER_PAGE_OPTIONS, type BlogView } from "./_components/blog-constants";
import { NewsletterSection } from "./_components/NewsletterSection";
import { getNewsletterSettings } from "@/lib/queries/newsletter";

export const revalidate = 3600;

type PerPage = (typeof PER_PAGE_OPTIONS)[number];

function clampPerPage(raw: string | undefined): PerPage {
  const n = Number.parseInt(raw ?? String(PER_PAGE_OPTIONS[0]), 10);
  return (PER_PAGE_OPTIONS as readonly number[]).includes(n)
    ? (n as PerPage)
    : PER_PAGE_OPTIONS[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as LocaleCode;
  const tBlog = await getTranslations("blog");
  const title = tBlog("title");
  const description = "Insights, reviews, and guides to help you shop smarter";

  return {
    title,
    description,
    alternates: {
      languages: {
        en: `/en/blog`,
        "bn-BD": `/bn-BD/blog`,
        sv: `/sv/blog`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/blog`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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

function GridPostCard({ post, locale }: { post: BlogPost; locale: LocaleCode }) {
  const title = t(post.title, locale) as string;
  const excerpt = t(post.excerpt, locale) as string;
  const slug = t(post.slug, locale) as string;
  const categoryName = post.blog_categories
    ? (t(post.blog_categories.name, locale) as string)
    : null;
  const categoryColor = post.blog_categories?.color ?? null;
  const dateStr = post.published_at ? formatDate(post.published_at, locale) : "";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-surface">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={(t(post.cover_image_alt, locale) as string) || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted">
            📝
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName && (
          <CategoryBadge color={categoryColor} name={categoryName} />
        )}
        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-brand sm:text-base">
          {title}
        </h2>
        {excerpt && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
            {excerpt}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted">
          {post.author_avatar_url ? (
            <Image
              src={post.author_avatar_url}
              alt={post.author_name}
              width={18}
              height={18}
              className="rounded-full"
            />
          ) : (
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
              {post.author_name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="font-medium text-foreground">{post.author_name}</span>
          {dateStr && <span>{dateStr}</span>}
          {post.read_time_minutes > 0 && (
            <span>{post.read_time_minutes} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post, locale }: { post: BlogPost; locale: LocaleCode }) {
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
    <Link
      href={`/blog/${slug}`}
      className="group flex gap-4 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="relative h-27.5 w-37.5 shrink-0 overflow-hidden rounded-lg bg-surface">
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
            📝
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
          <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-brand sm:text-base">
            {title}
          </h2>
          {excerpt && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">
              {excerpt}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {post.author_avatar_url ? (
            <Image
              src={post.author_avatar_url}
              alt={post.author_name}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
              {post.author_name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="font-medium text-foreground">
            {post.author_name}
          </span>
          {dateStr && <span>{dateStr}</span>}
          {post.read_time_minutes > 0 && (
            <span>{post.read_time_minutes} min read</span>
          )}
        </div>
      </div>
    </Link>
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
            📝
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

function SidebarCategoryList({
  categories,
  locale,
  activeSlug,
}: {
  categories: BlogCategory[];
  locale: LocaleCode;
  activeSlug: string | undefined;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">
        Categories
      </h2>
      <ul className="space-y-1">
        <li>
          <Link
            href="/blog"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              !activeSlug
                ? "bg-brand/10 font-semibold text-brand"
                : "text-foreground hover:bg-surface hover:text-brand"
            }`}
          >
            All articles
          </Link>
        </li>
        {categories.map((cat) => {
          const name = t(cat.name, locale) as string;
          const enSlug = (cat.slug as Record<string, string>).en ?? "";
          const isActive = activeSlug === enSlug;
          return (
            <li key={cat.id}>
              <Link
                href={isActive ? "/blog" : `/blog?category=${enSlug}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-brand/10 font-semibold text-brand"
                    : "text-foreground hover:bg-surface hover:text-brand"
                }`}
              >
                {cat.color && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeaturedPostCard({
  post,
  locale,
}: {
  post: BlogPost;
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
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-surface">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={(t(post.cover_image_alt, locale) as string) || title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted">
            RaoFinds
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        {categoryName && (
          <CategoryBadge color={categoryColor} name={categoryName} />
        )}
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-brand">
          {title}
        </h3>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted">
          <span>{post.author_name}</span>
          {dateStr && <span>{dateStr}</span>}
        </div>
      </div>
    </Link>
  );
}

function buildPageHref(
  base: string,
  params: URLSearchParams,
  targetPage: number,
): string {
  const p = new URLSearchParams(params);
  if (targetPage <= 1) {
    p.delete("page");
  } else {
    p.set("page", String(targetPage));
  }
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    category?: string;
    q?: string;
    view?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    page: pageParam,
    perPage: perPageParam,
    category: categoryParam,
    q: searchParam,
    view: viewParam,
  } = await searchParams;
  const view: BlogView = viewParam === "grid" ? "grid" : "list";

  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const perPage = clampPerPage(perPageParam);
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * perPage;
  const searchQuery = searchParam?.trim() ?? "";

  const tBlog = await getTranslations("blog");

  // Fetch categories first to resolve category slug → id
  const categories = await getActiveBlogCategories();

  const activeCategory = categoryParam
    ? categories.find(
        (c) => ((c.slug as Record<string, string>).en ?? "") === categoryParam,
      )
    : undefined;
  const categoryId = activeCategory?.id;

  const [posts, trendingPosts, featuredPosts, totalCount, newsletterSettings] =
    await Promise.all([
      getPublishedBlogPosts(perPage, offset, categoryId, searchQuery),
      getTrendingBlogPosts(5),
      page === 1 && !categoryId && !searchQuery
        ? getFeaturedBlogPosts(3)
        : Promise.resolve([]),
      getPublishedBlogPostsCount(categoryId, searchQuery),
      getNewsletterSettings(),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  // Build base search params for pagination links
  const baseParams = new URLSearchParams();
  if (perPage !== PER_PAGE_OPTIONS[0]) baseParams.set("perPage", String(perPage));
  if (categoryParam) baseParams.set("category", categoryParam);
  if (searchQuery) baseParams.set("q", searchQuery);
  const basePath = `/blog`;

  const hasActiveFilter = !!categoryId || !!searchQuery;

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-linear-to-r from-gray-900 to-gray-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand">
            RaoFinds
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {tBlog("title")}
          </h1>
          <p className="mt-3 max-w-xl text-base text-gray-300 sm:text-lg">
            {tBlog("subtitle")}
          </p>
        </div>
      </section>

      {/* Featured posts — only on unfiltered page 1 */}
      {featuredPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {tBlog("featured")}
            </h2>
            <div className="ml-4 h-0.5 flex-1 bg-border" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((p) => (
              <FeaturedPostCard key={p.id} post={p} locale={loc} />
            ))}
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Post list */}
          <main className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {hasActiveFilter ? "Search results" : tBlog("all_articles")}
              </h2>
              <div className="ml-4 h-0.5 flex-1 bg-border" />
            </div>

            {/* Active filter chips */}
            {hasActiveFilter && (
              <div className="mb-4 flex flex-wrap gap-2">
                {activeCategory && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                    Category: {t(activeCategory.name, loc) as string}
                    <Link
                      href={
                        searchQuery
                          ? `${basePath}?q=${encodeURIComponent(searchQuery)}`
                          : basePath
                      }
                      className="ml-0.5 rounded-full hover:text-brand/60"
                      aria-label="Remove category filter"
                    >
                      ✕
                    </Link>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <Link
                      href={
                        categoryParam
                          ? `${basePath}?category=${categoryParam}`
                          : basePath
                      }
                      className="ml-0.5 rounded-full hover:text-brand/60"
                      aria-label="Remove search filter"
                    >
                      ✕
                    </Link>
                  </span>
                )}
              </div>
            )}

            {/* Filters row — wrapped in Suspense because BlogFilters uses useSearchParams */}
            <Suspense>
              <BlogFilters
                currentPerPage={perPage}
                currentSearch={searchQuery}
                totalCount={totalCount}
                currentView={view}
              />
            </Suspense>

            {posts.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <p className="text-lg text-muted">{tBlog("no_posts")}</p>
                {hasActiveFilter && (
                  <Link
                    href={basePath}
                    className="mt-4 inline-block text-sm text-brand underline"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            ) : (
              <>
                {view === "grid" ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                      <GridPostCard key={post.id} post={post} locale={loc} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} locale={loc} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-sm"
                  >
                    {/* Previous */}
                    {page > 1 ? (
                      <Link
                        href={buildPageHref(basePath, baseParams, page - 1)}
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 font-medium text-foreground transition-colors hover:bg-surface"
                      >
                        ←
                      </Link>
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-muted opacity-50 cursor-not-allowed">
                        ←
                      </span>
                    )}

                    {/* Page numbers — odd pages only, plus current and last */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p % 2 === 1 ||
                          p === page ||
                          p === totalPages,
                      )
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1)
                          acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === "…" ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="inline-flex h-9 w-9 items-center justify-center text-muted"
                          >
                            …
                          </span>
                        ) : item === page ? (
                          <span
                            key={item}
                            aria-current="page"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-semibold text-white"
                          >
                            {item}
                          </span>
                        ) : (
                          <Link
                            key={item}
                            href={buildPageHref(basePath, baseParams, item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white font-medium text-foreground transition-colors hover:bg-surface"
                          >
                            {item}
                          </Link>
                        ),
                      )}

                    {/* Next */}
                    {page < totalPages ? (
                      <Link
                        href={buildPageHref(basePath, baseParams, page + 1)}
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 font-medium text-foreground transition-colors hover:bg-surface"
                      >
                        →
                      </Link>
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-muted opacity-50 cursor-not-allowed">
                        →
                      </span>
                    )}
                  </nav>
                )}
              </>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-6 lg:w-80 xl:w-96">
            {trendingPosts.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg">🔥</span>
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

            <SidebarCategoryList
              categories={categories}
              locale={loc}
              activeSlug={categoryParam}
            />
          </aside>
        </div>
      </div>

      {/* Newsletter section */}
      {newsletterSettings.show && (
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <NewsletterSection
            title={newsletterSettings.title}
            subtitle={newsletterSettings.subtitle}
            background={newsletterSettings.background}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}
