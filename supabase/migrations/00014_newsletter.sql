-- Newsletter subscribers table
create table if not exists newsletter_subscribers (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  name             text,
  locale           text not null default 'en',
  is_active        boolean not null default true,
  subscribed_at    timestamptz not null default now(),
  unsubscribed_at  timestamptz,
  ip_hash          text
);

create index if not exists idx_newsletter_subscribers_email    on newsletter_subscribers(email);
create index if not exists idx_newsletter_subscribers_active   on newsletter_subscribers(is_active);
create index if not exists idx_newsletter_subscribers_subbed   on newsletter_subscribers(subscribed_at desc);

-- updated_at trigger
create trigger update_newsletter_subscribers_updated_at
  before update on newsletter_subscribers
  for each row execute function update_updated_at_column();

-- RLS
alter table newsletter_subscribers enable row level security;

-- Public can insert (subscribe)
create policy "public_insert_newsletter"
  on newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

-- Only service role reads / updates / deletes
create policy "admin_all_newsletter"
  on newsletter_subscribers for all
  to service_role
  using (true)
  with check (true);

-- Seed default newsletter settings into admin_settings (safe upsert)
insert into admin_settings (key, value)
values (
  'newsletter_settings',
  '{
    "show": true,
    "title": "Subscribe to our newsletter",
    "subtitle": "Sign up to receive our latest news and products. Stay updated on the latest developments and special offers!",
    "background": "indigo"
  }'::jsonb
)
on conflict (key) do nothing;
