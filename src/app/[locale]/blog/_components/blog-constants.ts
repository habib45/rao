export const PER_PAGE_OPTIONS = [10, 20, 50, 100, 200] as const;
export const BLOG_VIEW_OPTIONS = ["list", "grid"] as const;
export type BlogView = (typeof BLOG_VIEW_OPTIONS)[number];
