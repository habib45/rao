# Phase 18 — Test Matrix

## F18.1 — Blog Pagination & Filtering

| # | Test | Type | Expected |
|---|---|---|---|
| 1.1 | `getPublishedBlogPosts` with categoryId filter returns only matching posts | unit | posts all have correct category |
| 1.2 | `getPublishedBlogPosts` with search query calls textSearch | unit | Supabase mock receives textSearch call |
| 1.3 | `getPublishedBlogPostsCount` with categoryId returns count matching filter | unit | returns mocked count |
| 1.4 | perPage=50 URL param sets correct offset/limit in page | integration | page renders 50-item slice |
| 1.5 | invalid perPage clamps to 20 | unit | clampPerPage(999) === 20 |

## F18.2 — Newsletter

| # | Test | Type | Expected |
|---|---|---|---|
| 2.1 | POST /api/newsletter/subscribe with valid email returns { success: true } | API | 200 success |
| 2.2 | POST /api/newsletter/subscribe with invalid email returns 400 | API | 400 validation error |
| 2.3 | POST /api/newsletter/subscribe without checkbox consent returns 400 | API | 400 consent error |
| 2.4 | GET /admin/api/newsletter/settings returns newsletter_settings object | API | 200 with settings shape |
| 2.5 | PATCH /admin/api/newsletter/settings with valid body updates setting | API | 200 updated |
| 2.6 | PATCH /admin/api/newsletter/settings with invalid body returns 400 | API | 400 Zod error |
| 2.7 | GET /admin/api/newsletter/subscribers returns paginated list | API | 200 with data + total |
| 2.8 | NewsletterForm renders email input and subscribe button | component | elements present |
| 2.9 | NewsletterForm shows success state after submit | component | success message shown |
| 2.10 | NewsletterForm shows error state on API failure | component | error message shown |

## F18.3 — Comment Management

| # | Test | Type | Expected |
|---|---|---|---|
| 3.1 | GET /admin/api/blog/comments?status=pending returns only unapproved | API | data all is_approved=false |
| 3.2 | GET /admin/api/blog/comments?status=approved returns only approved | API | data all is_approved=true |
| 3.3 | PATCH /admin/api/blog/comments/[id] with { is_approved: true } approves comment | API | 200, is_approved=true |
| 3.4 | PATCH /admin/api/blog/comments/[id] with invalid body returns 400 | API | 400 Zod error |
| 3.5 | DELETE /admin/api/blog/comments/[id] deletes comment | API | 200 success |
| 3.6 | CommentsTable renders table with approve/hide/delete actions | component | 3 action buttons visible |
| 3.7 | CommentsTable approve action calls PATCH and refreshes | component | mutation called |
| 3.8 | CommentsTable delete action shows confirm dialog | component | dialog renders |
