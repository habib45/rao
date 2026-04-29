-- Blog system: categories, posts, tags, views, comments

-- Blog Categories
create table if not exists blog_categories (
  id           uuid primary key default gen_random_uuid(),
  name         jsonb not null default '{}',
  slug         jsonb not null default '{}',
  description  jsonb not null default '{}',
  color        text,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Blog Posts
create type blog_post_status as enum ('draft', 'published', 'archived');

create table if not exists blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  blog_category_id    uuid references blog_categories(id) on delete set null,
  title               jsonb not null default '{}',
  slug                jsonb not null default '{}',
  excerpt             jsonb not null default '{}',
  content             text not null default '',
  cover_image_url     text,
  cover_image_alt     jsonb not null default '{}',
  meta_title          jsonb not null default '{}',
  meta_description    jsonb not null default '{}',
  author_name         text not null default 'BestFinds',
  author_avatar_url   text,
  status              blog_post_status not null default 'draft',
  is_featured         boolean not null default false,
  view_count          int not null default 0,
  read_time_minutes   int not null default 0,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Blog Tags
create table if not exists blog_tags (
  id    uuid primary key default gen_random_uuid(),
  name  jsonb not null default '{}',
  slug  jsonb not null default '{}'
);

-- Blog Post ↔ Tag many-to-many
create table if not exists blog_post_tags (
  blog_post_id  uuid not null references blog_posts(id) on delete cascade,
  blog_tag_id   uuid not null references blog_tags(id) on delete cascade,
  primary key (blog_post_id, blog_tag_id)
);

-- Blog Post Views (for view tracking)
create table if not exists blog_post_views (
  id           uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references blog_posts(id) on delete cascade,
  session_id   text,
  locale       text,
  viewed_at    timestamptz not null default now()
);

-- Blog Comments
create table if not exists blog_comments (
  id             uuid primary key default gen_random_uuid(),
  blog_post_id   uuid not null references blog_posts(id) on delete cascade,
  author_name    text not null,
  author_email   text not null,
  body           text not null,
  is_approved    boolean not null default false,
  parent_id      uuid references blog_comments(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- Indexes
create index if not exists idx_blog_posts_status       on blog_posts(status);
create index if not exists idx_blog_posts_published_at on blog_posts(published_at desc);
create index if not exists idx_blog_posts_category     on blog_posts(blog_category_id);
create index if not exists idx_blog_posts_featured     on blog_posts(is_featured) where is_featured = true;
create index if not exists idx_blog_posts_views        on blog_posts(view_count desc);
create index if not exists idx_blog_post_views_post    on blog_post_views(blog_post_id);
create index if not exists idx_blog_comments_post      on blog_comments(blog_post_id);
create index if not exists idx_blog_comments_approved  on blog_comments(is_approved);

-- Full-text search on English title + content
alter table blog_posts add column if not exists
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title->>'en', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;

create index if not exists idx_blog_posts_fts on blog_posts using gin(search_vector);

-- updated_at triggers
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on blog_posts;
create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at_column();

drop trigger if exists blog_categories_updated_at on blog_categories;
create trigger blog_categories_updated_at
  before update on blog_categories
  for each row execute function update_updated_at_column();

-- RLS
alter table blog_posts      enable row level security;
alter table blog_categories enable row level security;
alter table blog_tags       enable row level security;
alter table blog_post_tags  enable row level security;
alter table blog_post_views enable row level security;
alter table blog_comments   enable row level security;

-- Public: read published posts & active categories/tags
create policy "Public read published blog posts"
  on blog_posts for select
  using (status = 'published');

create policy "Public read active blog categories"
  on blog_categories for select
  using (is_active = true);

create policy "Public read blog tags"
  on blog_tags for select
  using (true);

create policy "Public read blog post tags"
  on blog_post_tags for select
  using (true);

-- Public: insert view tracking
create policy "Public insert blog post views"
  on blog_post_views for insert
  with check (true);

-- Public: read approved comments
create policy "Public read approved blog comments"
  on blog_comments for select
  using (is_approved = true);

-- Public: insert comments (pending approval)
create policy "Public insert blog comments"
  on blog_comments for insert
  with check (is_approved = false);

-- Service role: full access (admin operations)
create policy "Service role full access blog posts"
  on blog_posts for all
  using (auth.role() = 'service_role');

create policy "Service role full access blog categories"
  on blog_categories for all
  using (auth.role() = 'service_role');

create policy "Service role full access blog tags"
  on blog_tags for all
  using (auth.role() = 'service_role');

create policy "Service role full access blog comments"
  on blog_comments for all
  using (auth.role() = 'service_role');
