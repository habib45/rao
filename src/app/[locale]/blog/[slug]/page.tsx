import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { LocaleCode, BlogPost } from "@/types/domain";
import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
  getApprovedBlogComments,
  getAllPublishedSlugs,
  getTrendingBlogPosts,
} from "@/lib/queries/blog";
import { t } from "@/lib/i18n/translate";
import { formatDate } from "@/lib/i18n/format";
import { parseContentSegments } from "@/lib/wizard";
import { WizardBlock } from "./_components/WizardBlock";
import { ImageResponsiveFixer } from "./_components/ImageResponsiveFixer";
import { ViewTracker } from "./_components/ViewTracker";
import { SocialShare } from "./_components/SocialShare";
import { CommentForm } from "./_components/CommentForm";
import { Calendar, Clock, Eye, Tag } from "lucide-react";

export const revalidate = 3600;

const SUPPORTED_LOCALES: LocaleCode[] = ["en", "bn-BD", "sv"];
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://raofinds.com";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
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
  const post = await getBlogPostBySlug(slug);

  if (!post) return { title: "Post not found — RaoFinds" };

  const loc = locale as LocaleCode;
  const title = (t(post.meta_title, loc) as string) || (t(post.title, loc) as string);
  const description =
    (t(post.meta_description, loc) as string) || (t(post.excerpt, loc) as string);

  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const localizedSlug = (post.slug as Record<string, string | undefined>)[l];
    if (localizedSlug) languages[l] = `/${l}/blog/${localizedSlug}`;
  }
  const canonicalSlug = (post.slug as Record<string, string | undefined>)[loc] ?? slug;

  return {
    title,
    description,
    alternates: {
      canonical: `/${loc}/blog/${canonicalSlug}`,
      languages,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${BASE_URL}/${loc}/blog/${canonicalSlug}`,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}


function formatCommentDate(dateStr: string, locale: string): string {
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
      className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
      style={{ backgroundColor: bg }}
    >
      {name}
    </span>
  );
}

function RelatedBlogCard({ post, locale }: { post: BlogPost; locale: LocaleCode }) {
  const title = t(post.title, locale) as string;
  const slug = t(post.slug, locale) as string;
  const categoryName = post.blog_categories
    ? (t(post.blog_categories.name, locale) as string)
    : null;
  const categoryColor = post.blog_categories?.color ?? "#f59e0b";
  const dateStr = post.published_at ? formatDate(post.published_at, locale, "long") : "";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
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
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">
            BF
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName && (
          <span
            className="inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {categoryName}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-brand">
          {title}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          {dateStr && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </span>
          )}
          {post.read_time_minutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.read_time_minutes} min read
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SidebarPostCard({ post, locale }: { post: BlogPost; locale: LocaleCode }) {
  const title = t(post.title, locale) as string;
  const slug = t(post.slug, locale) as string;
  const dateStr = post.published_at ? formatDate(post.published_at, locale, "long") : "";

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-surface"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={(t(post.cover_image_alt, locale) as string) || title}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted">
            BF
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1">
        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
          {title}
        </h4>
        {dateStr && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Calendar className="h-3 w-3" />
            {dateStr}
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as LocaleCode;

  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const tBlog = await getTranslations("blog");

  const [related, comments, trending] = await Promise.all([
    getRelatedBlogPosts(post.id, post.blog_category_id, 4),
    getApprovedBlogComments(post.id),
    getTrendingBlogPosts(5),
  ]);

  const title = t(post.title, loc) as string;
  const excerpt = t(post.excerpt, loc) as string;
  const categoryName = post.blog_categories ? (t(post.blog_categories.name, loc) as string) : null;
  const categorySlug = post.blog_categories ? (t(post.blog_categories.slug, loc) as string) : null;
  const categoryColor = post.blog_categories?.color ?? null;
  const dateStr = post.published_at ? formatDate(post.published_at, loc, "long") : "";
  const tags = (post.blog_post_tags ?? []).map((row) => row.blog_tags);
  const canonicalSlug = (post.slug as Record<string, string | undefined>)[loc] ?? slug;
  const articleUrl = `${BASE_URL}/${loc}/blog/${canonicalSlug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    author: { "@type": "Person", name: post.author_name },
    publisher: { "@type": "Organization", name: "RaoFinds" },
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: articleUrl,
  };

  return (
    <div className="min-h-screen bg-background">
      <ViewTracker postId={post.id} />
      <ImageResponsiveFixer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Full-width cover image */}
      <div className="relative w-full bg-gray-900" style={{ minHeight: 250 }}>
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={(t(post.cover_image_alt, loc) as string) || title}
            fill
            sizes="100vw"
            className="object-cover opacity-80"
            priority
          />
        ) : (
          <div className="h-[250px] w-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-3 text-xs text-white/70 sm:mb-4 sm:text-sm">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-white">Home</Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/blog" className="hover:text-white">{tBlog("title")}</Link>
                </li>
                {categoryName && categorySlug && (
                  <>
                    <li aria-hidden>/</li>
                    <li>
                      <Link href={`/blog/category/${categorySlug}`} className="hover:text-white">
                        {categoryName}
                      </Link>
                    </li>
                  </>
                )}
                <li aria-hidden>/</li>
                <li className="line-clamp-1 text-white/50">{title}</li>
              </ol>
            </nav>

            {categoryName && (
              <div className="mb-2 sm:mb-3">
                <CategoryBadge color={categoryColor} name={categoryName} />
              </div>
            )}

            <h1 className="max-w-3xl text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-4xl">
              {title}
            </h1>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/80 sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
              <div className="flex items-center gap-2">
                {post.author_avatar_url ? (
                  <Image
                    src={post.author_avatar_url}
                    alt={post.author_name}
                    width={24}
                    height={24}
                    className="rounded-full ring-2 ring-white/40 sm:h-7 sm:w-7"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white ring-2 ring-white/40 sm:h-7 sm:w-7 sm:text-[11px]">
                    {post.author_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="font-medium text-xs sm:text-sm">{post.author_name}</span>
              </div>
              {dateStr && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {dateStr}
                </span>
              )}
              {post.read_time_minutes > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {tBlog("min_read", { count: post.read_time_minutes })}
                </span>
              )}
              {post.view_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {post.view_count.toLocaleString()} views
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">

          {/* Article body */}
          <article className="min-w-0 flex-1">
            {excerpt && (
              <p className="mb-6 rounded-lg border-l-4 border-brand bg-surface py-3 pl-4 pr-3 text-sm font-medium italic text-muted sm:mb-8 sm:py-4 sm:pl-5 sm:pr-4 sm:text-base">
                {excerpt}
              </p>
            )}

            {parseContentSegments(post.content).map((seg, i) =>
              seg.type === "html" ? (
                <div
                  key={i}
                  className="article-content max-w-none text-foreground"
                  style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}
                  dangerouslySetInnerHTML={{ __html: seg.content }}
                />
              ) : seg.type === "wizard" ? (
                <WizardBlock key={i} steps={seg.steps} showFooter={seg.showFooter} shadow={seg.shadow} showBorder={seg.showBorder} showPanelBorder={seg.showPanelBorder} panelBorderColor={seg.panelBorderColor} />
              ) : null,
            )}

            <style>{`
              .article-content { font-size: 1rem; line-height: 1.7; color: var(--color-foreground); overflow-x: hidden; width: 100%; contain: layout; }
              @media (min-width: 640px) {
                .article-content { font-size: 1.0625rem; line-height: 1.8; }
              }
              .article-content > * + * { margin-top: 1rem; }
              @media (min-width: 640px) {
                .article-content > * + * { margin-top: 1.25rem; }
              }
              .article-content h1 { font-size: 1.5rem; font-weight: 800; line-height: 1.2; margin-top: 2rem; color: var(--color-foreground); }
              @media (min-width: 640px) {
                .article-content h1 { font-size: 2rem; margin-top: 2.5rem; }
              }
              .article-content h2 { font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin-top: 1.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-border); color: var(--color-foreground); }
              @media (min-width: 640px) {
                .article-content h2 { font-size: 1.5rem; margin-top: 2rem; }
              }
              .article-content h3 { font-size: 1.125rem; font-weight: 700; line-height: 1.4; margin-top: 1.5rem; color: var(--color-foreground); }
              @media (min-width: 640px) {
                .article-content h3 { font-size: 1.25rem; margin-top: 1.75rem; }
              }
              .article-content h4, .article-content h5, .article-content h6 { font-weight: 700; line-height: 1.4; margin-top: 1.25rem; color: var(--color-foreground); }
              @media (min-width: 640px) {
                .article-content h4, .article-content h5, .article-content h6 { margin-top: 1.5rem; }
              }
              .article-content p { color: var(--color-foreground); }
              .article-content a { color: var(--color-brand); text-decoration: underline; text-underline-offset: 3px; }
              .article-content a:hover { opacity: 0.8; }
              .article-content ul { list-style-type: disc; padding-left: 1.5rem; }
              @media (min-width: 640px) {
                .article-content ul { padding-left: 1.75rem; }
              }
              .article-content ol { list-style-type: decimal; padding-left: 1.5rem; }
              @media (min-width: 640px) {
                .article-content ol { padding-left: 1.75rem; }
              }
              .article-content li { margin-top: 0.5rem; }
              .article-content blockquote { border-left: 4px solid var(--color-brand); padding: 0.75rem 1rem; font-style: italic; color: var(--color-muted); background: var(--color-surface); border-radius: 0 0.5rem 0.5rem 0; margin: 1.25rem 0; }
              @media (min-width: 640px) {
                .article-content blockquote { padding: 1rem 1.25rem; margin: 1.5rem 0; }
              }
              .article-content img { border-radius: 0.75rem; margin: 1rem 0; max-width: 100% !important; height: auto !important; display: block !important; width: 100% !important; object-fit: contain; }
              @media (min-width: 640px) {
                .article-content img { margin: 1.5rem 0; }
              }
              .article-content pre { background: var(--color-surface); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.8125rem; border: 1px solid var(--color-border); }
              @media (min-width: 640px) {
                .article-content pre { padding: 1.25rem; font-size: 0.875rem; }
              }
              .article-content code { background: var(--color-surface); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125em; border: 1px solid var(--color-border); }
              .article-content pre code { background: transparent; padding: 0; border: none; }
              .article-content table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
              @media (min-width: 640px) {
                .article-content table { margin: 1.5rem 0; font-size: 0.9375rem; }
              }
              .article-content th, .article-content td { border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; }
              @media (min-width: 640px) {
                .article-content th, .article-content td { padding: 0.625rem 0.875rem; }
              }
              .article-content th { background: var(--color-surface); font-weight: 700; text-align: left; }
              .article-content tr:nth-child(even) td { background: color-mix(in srgb, var(--color-surface) 60%, transparent); }
              .article-content hr { border: none; border-top: 2px solid var(--color-border); margin: 1.75rem 0; }
              @media (min-width: 640px) {
                .article-content hr { margin: 2rem 0; }
              }
            `}</style>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-5 sm:mt-10 sm:pt-6">
                <Tag className="h-4 w-4 text-muted" />
                <span className="text-sm font-semibold text-foreground">{tBlog("tags")}:</span>
                {tags.map((tag) => {
                  const tagName = t(tag.name, loc) as string;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-foreground hover:border-brand hover:text-brand transition-colors sm:px-3 sm:py-1 sm:text-xs"
                    >
                      #{tagName}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Related posts — above share section */}
            {related.length > 0 && (
              <div className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8">
                <h2 className="mb-4 text-base font-bold text-foreground sm:mb-5 sm:text-lg">
                  More from{" "}
                  <span style={{ color: categoryColor ?? "#f59e0b" }}>
                    {categoryName ?? "the blog"}
                  </span>
                </h2>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {related.slice(0, 3).map((p) => (
                    <RelatedBlogCard key={p.id} post={p} locale={loc} />
                  ))}
                </div>
              </div>
            )}

            {/* Social sharing */}
            <div className="mt-6 rounded-xl border border-border bg-surface p-4 sm:mt-8 sm:p-5">
              <SocialShare
                url={articleUrl}
                title={title}
                shareLabel={tBlog("share")}
                copyLabel="Copy link"
                copiedLabel="Copied!"
              />
            </div>

            {/* Author card */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 sm:mt-8 sm:gap-4 sm:p-5">
              {post.author_avatar_url ? (
                <Image
                  src={post.author_avatar_url}
                  alt={post.author_name}
                  width={48}
                  height={48}
                  className="rounded-full ring-2 ring-border sm:h-14 sm:w-14"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white sm:h-14 sm:w-14 sm:text-xl">
                  {post.author_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted sm:text-xs">Author</p>
                <p className="mt-0.5 text-sm font-bold text-foreground sm:text-base">{post.author_name}</p>
              </div>
            </div>

            {/* Comments */}
            <section className="mt-8 sm:mt-12">
              <h2 className="mb-5 text-lg font-bold text-foreground sm:mb-6 sm:text-xl">
                Comments ({comments.length})
              </h2>

              {comments.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-4 text-xs text-muted sm:p-5 sm:text-sm">
                  Be the first to leave a comment.
                </p>
              ) : (
                <ul className="space-y-3 sm:space-y-4">
                  {comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand sm:h-8 sm:w-8 sm:text-sm">
                          {comment.author_name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-foreground sm:text-sm">
                          {comment.author_name}
                        </span>
                        <span className="text-[11px] text-muted sm:text-xs">
                          {formatCommentDate(comment.created_at, loc)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line pl-9 text-xs text-foreground sm:pl-10 sm:text-sm">
                        {comment.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm sm:mt-8 sm:p-6">
                <h3 className="mb-4 text-base font-bold text-foreground sm:mb-5 sm:text-lg">Leave a comment</h3>
                <CommentForm
                  postId={post.id}
                  labels={{
                    nameLabel: "Name",
                    emailLabel: "Email",
                    messageLabel: "Message",
                    submitLabel: "Post comment",
                    submittingLabel: "Posting...",
                    successLabel: "Thanks! Your comment is awaiting moderation.",
                    errorLabel: "Something went wrong. Please try again.",
                  }}
                />
              </div>
            </section>
          </article>

          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-72 xl:w-80">
            <div className="sticky top-16 space-y-5 sm:top-20 sm:space-y-6">

              {/* Trending posts */}
              {trending.length > 0 && (
                <div className="rounded-xl border border-border bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className="h-3 w-3 rounded-full bg-brand" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground sm:text-sm">
                      {tBlog("trending")}
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {trending.map((p, i) => (
                      <div key={p.id} className="flex items-start gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
                        <span className="mt-0.5 text-base font-extrabold text-border leading-none w-5 shrink-0 sm:text-lg">
                          {i + 1}
                        </span>
                        <SidebarPostCard post={p} locale={loc} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related posts */}
              {related.length > 0 && (
                <div className="rounded-xl border border-border bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className="h-3 w-3 rounded-full bg-brand" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground sm:text-sm">
                      Related Articles
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {related.map((p) => (
                      <div key={p.id} className="px-3 py-1.5 sm:px-4 sm:py-2">
                        <SidebarPostCard post={p} locale={loc} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              {categoryName && categorySlug && (
                <div className="rounded-xl border border-border bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className="h-3 w-3 rounded-full bg-brand" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground sm:text-sm">
                      {tBlog("categories")}
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4">
                    <Link
                      href={`/blog/category/${categorySlug}`}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 sm:px-4 sm:py-2 sm:text-sm"
                      style={{ backgroundColor: categoryColor ?? "#f59e0b" }}
                    >
                      {categoryName}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
}
