import Image from "next/image";
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

export const revalidate = 3600;

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Blog — BestFinds",
    "bn-BD": "ব্লগ — BestFinds",
    sv: "Blogg — BestFinds",
  };
  const descriptions: Record<string, string> = {
    en: "Insights, reviews, and guides to help you shop smarter on Amazon.",
    "bn-BD": "স্মার্টভাবে কেনাকাটা করতে সাহায্য করার জন্য অন্তর্দৃষ্টি, রিভিউ এবং গাইড।",
    sv: "Insikter, recensioner och guider för att hjälpa dig handla smartare på Amazon.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    alternates: {
      languages: {
        en: `/en/blog`,
        "bn-BD": `/bn-BD/blog`,
        sv: `/sv/blog`,
      },
    },
  };
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CategoryBadge({ color, name }: { color: string | null; name: string }) {
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
      {/* Thumbnail */}
      <div className="relative h-[110px] w-[150px] shrink-0 overflow-hidden rounded-lg bg-surface">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={t(post.cover_image_alt, locale) as string || title}
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

      {/* Content */}
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

        {/* Meta row */}
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
          <span className="font-medium text-foreground">{post.author_name}</span>
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
    <Link
      href={`/blog/${slug}`}
      className="group flex gap-3 py-3"
    >
      {/* Rank number */}
      <span className="mt-0.5 shrink-0 text-2xl font-black leading-none text-border">
        {String(index + 1).padStart(2, "0")}
      </span>
      {/* Thumbnail */}
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
      {/* Text */}
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
}: {
  categories: BlogCategory[];
  locale: LocaleCode;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-foreground">
        Categories
      </h2>
      <ul className="space-y-2">
        {categories.map((cat) => {
          const name = t(cat.name, locale) as string;
          const slug = t(cat.slug, locale) as string;
          return (
            <li key={cat.id}>
              <Link
                href={`/blog/category/${slug}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface hover:text-brand"
              >
                {cat.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
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
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface">
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
            BestFinds
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

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const tBlog = await getTranslations("blog");

  const [posts, trendingPosts, categories, featuredPosts, totalCount] =
    await Promise.all([
      getPublishedBlogPosts(PAGE_SIZE, offset),
      getTrendingBlogPosts(5),
      getActiveBlogCategories(),
      page === 1 ? getFeaturedBlogPosts(3) : Promise.resolve([]),
      getPublishedBlogPostsCount(),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand">
            BestFinds
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{tBlog("title")}</h1>
          <p className="mt-3 max-w-xl text-base text-gray-300 sm:text-lg">
            {tBlog("subtitle")}
          </p>
        </div>
      </section>

      {/* Featured posts */}
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
          {/* Post list — 2/3 width */}
          <main className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {tBlog("all_articles")}
              </h2>
              <div className="h-0.5 flex-1 ml-4 bg-border" />
            </div>

            {posts.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <p className="text-lg text-muted">{tBlog("no_posts")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} locale={loc} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Pagination"
                    className="mt-8 flex items-center justify-between gap-3 text-sm"
                  >
                    {page > 1 ? (
                      <Link
                        href={
                          page - 1 === 1
                            ? `/blog`
                            : `/blog?page=${page - 1}`
                        }
                        className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span className="text-muted">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages ? (
                      <Link
                        href={`/blog?page=${page + 1}`}
                        className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface"
                      >
                        Next
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                )}
              </>
            )}
          </main>

          {/* Sidebar — 1/3 width */}
          <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">
            {/* Trending */}
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

            {/* Categories */}
            <SidebarCategoryList categories={categories} locale={loc} />
          </aside>
        </div>
      </div>
    </div>
  );
}
