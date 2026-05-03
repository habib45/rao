/**
 * migrate-from-supabase.js
 * Fetches all data from Supabase and inserts into local MySQL.
 * Run: node scripts/migrate-from-supabase.js
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

// ── Config ────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://cjyjsagxcabwzvrlfizs.supabase.co/rest/v1';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqeWpzYWd4Y2Fid3p2cmxmaXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjMxODgzNSwiZXhwIjoyMDkxODk0ODM1fQ.o5n0cqCmCzQIkqVnjHLLGQ2Jx-wDZG8wSiRXsrwvJDw';

const db = await mysql.createConnection({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'bs23',
  database: process.env.DB_NAME     || 'orh_bestfinds',
  timezone: 'Z',
  multipleStatements: true,
});

// ── Helpers ───────────────────────────────────────────────────

async function fetchAll(table, select = '*', extra = '') {
  const url = `${SUPABASE_URL}/${table}?select=${select}&limit=1000${extra}`;
  const res  = await fetch(url, {
    headers: {
      apikey:        SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase fetch ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Convert Supabase ISO timestamp → MySQL DATETIME string
function dt(ts) {
  if (!ts) return null;
  return ts.replace('T', ' ').replace(/\+.*$/, '').replace('Z', '');
}

// Stringify object/array fields for JSON columns
const j = (v) => (v == null ? null : JSON.stringify(v));

function log(msg) { console.log(`  ${msg}`); }
function section(msg) { console.log(`\n▶ ${msg}`); }

// ── Main ──────────────────────────────────────────────────────

section('Connecting to MySQL...');
await db.query('SELECT 1');
log('Connected.');

// Disable FK checks so we can insert in any order
await db.query('SET FOREIGN_KEY_CHECKS = 0');

// ── 1. CATEGORIES ─────────────────────────────────────────────
section('Migrating categories...');
const categories = await fetchAll('categories');
log(`Fetched ${categories.length} categories from Supabase`);

for (const r of categories) {
  await db.query(
    `INSERT IGNORE INTO categories
       (id, amazon_node_id, name, slug, description, parent_id, sort_order, image_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id, r.amazon_node_id ?? null,
      j(r.name), j(r.slug), j(r.description),
      r.parent_id ?? null, r.sort_order ?? 0,
      r.image_url ?? null, r.is_active ? 1 : 0,
      dt(r.created_at), dt(r.updated_at),
    ]
  );
}
log(`✓ Inserted ${categories.length} categories`);

// ── 2. PRODUCTS ───────────────────────────────────────────────
section('Migrating products...');
const products = await fetchAll('products');
log(`Fetched ${products.length} products from Supabase`);

for (const r of products) {
  await db.query(
    `INSERT IGNORE INTO products
       (id, asin, category_id, name, slug, description, features, meta_title, meta_description,
        price_cents, original_price_cents, currency, discount_pct, rating, review_count,
        affiliate_url, brand, availability, is_featured, is_active,
        publish_at, product_status, rejection_reason, submitted_by,
        attributes, show_in_comparison, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      r.id, r.asin, r.category_id ?? null,
      j(r.name), j(r.slug), j(r.description),
      j(r.features ?? []), j(r.meta_title ?? {}), j(r.meta_description ?? {}),
      r.price_cents ?? null, r.original_price_cents ?? null,
      r.currency ?? 'USD', r.discount_pct ?? 0,
      r.rating ?? null, r.review_count ?? 0,
      r.affiliate_url, r.brand ?? null,
      r.availability ?? 'unknown',
      r.is_featured ? 1 : 0, r.is_active ? 1 : 0,
      dt(r.publish_at), r.product_status ?? 'draft',
      r.rejection_reason ?? null, r.submitted_by ?? null,
      j(r.attributes ?? {}), r.show_in_comparison ? 1 : 0,
      dt(r.created_at), dt(r.updated_at),
    ]
  );
}
log(`✓ Inserted ${products.length} products`);

// ── 3. PRODUCT IMAGES ─────────────────────────────────────────
section('Migrating product_images...');
const images = await fetchAll('product_images');
log(`Fetched ${images.length} product images from Supabase`);

for (const r of images) {
  await db.query(
    `INSERT IGNORE INTO product_images
       (id, product_id, url, alt_text, width, height, sort_order, is_primary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id, r.product_id, r.url,
      j(r.alt_text ?? {}),
      r.width ?? null, r.height ?? null,
      r.sort_order ?? 0, r.is_primary ? 1 : 0,
      dt(r.created_at),
    ]
  );
}
log(`✓ Inserted ${images.length} product images`);

// ── 4. BLOG CATEGORIES ────────────────────────────────────────
section('Migrating blog_categories...');
const blogCats = await fetchAll('blog_categories');
log(`Fetched ${blogCats.length} blog categories from Supabase`);

for (const r of blogCats) {
  await db.query(
    `INSERT IGNORE INTO blog_categories
       (id, name, slug, description, color, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id, j(r.name), j(r.slug), j(r.description ?? {}),
      r.color ?? null, r.sort_order ?? 0, r.is_active ? 1 : 0,
      dt(r.created_at), dt(r.updated_at),
    ]
  );
}
log(`✓ Inserted ${blogCats.length} blog categories`);

// ── 5. BLOG POSTS ─────────────────────────────────────────────
section('Migrating blog_posts...');
const blogPosts = await fetchAll('blog_posts');
log(`Fetched ${blogPosts.length} blog posts from Supabase`);

for (const r of blogPosts) {
  await db.query(
    `INSERT IGNORE INTO blog_posts
       (id, blog_category_id, title, slug, excerpt, content,
        cover_image_url, cover_image_alt, meta_title, meta_description,
        author_name, author_avatar_url, status, is_featured,
        view_count, read_time_minutes, published_at, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      r.id, r.blog_category_id ?? null,
      j(r.title), j(r.slug), j(r.excerpt ?? {}),
      r.content ?? '',
      r.cover_image_url ?? null, j(r.cover_image_alt ?? {}),
      j(r.meta_title ?? {}), j(r.meta_description ?? {}),
      r.author_name ?? 'BestFinds', r.author_avatar_url ?? null,
      r.status ?? 'draft', r.is_featured ? 1 : 0,
      r.view_count ?? 0, r.read_time_minutes ?? 0,
      dt(r.published_at), dt(r.created_at), dt(r.updated_at),
    ]
  );
}
log(`✓ Inserted ${blogPosts.length} blog posts`);

// ── 6. BLOG TAGS ──────────────────────────────────────────────
section('Migrating blog_tags...');
const blogTags = await fetchAll('blog_tags');
log(`Fetched ${blogTags.length} blog tags from Supabase`);

for (const r of blogTags) {
  await db.query(
    `INSERT IGNORE INTO blog_tags (id, name, slug) VALUES (?, ?, ?)`,
    [r.id, j(r.name), j(r.slug)]
  );
}
log(`✓ Inserted ${blogTags.length} blog tags`);

// ── 7. BLOG POST TAGS ─────────────────────────────────────────
section('Migrating blog_post_tags...');
const postTags = await fetchAll('blog_post_tags');
log(`Fetched ${postTags.length} blog_post_tags from Supabase`);

for (const r of postTags) {
  await db.query(
    `INSERT IGNORE INTO blog_post_tags (blog_post_id, blog_tag_id) VALUES (?, ?)`,
    [r.blog_post_id, r.blog_tag_id]
  );
}
log(`✓ Inserted ${postTags.length} blog_post_tags`);

// ── 8. BLOG COMMENTS ──────────────────────────────────────────
section('Migrating blog_comments...');
const comments = await fetchAll('blog_comments');
log(`Fetched ${comments.length} blog comments from Supabase`);

for (const r of comments) {
  await db.query(
    `INSERT IGNORE INTO blog_comments
       (id, blog_post_id, author_name, author_email, body, is_approved, parent_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id, r.blog_post_id, r.author_name, r.author_email,
      r.body, r.is_approved ? 1 : 0,
      r.parent_id ?? null, dt(r.created_at),
    ]
  );
}
log(`✓ Inserted ${comments.length} blog comments`);

// ── 9. NEWSLETTER SUBSCRIBERS ─────────────────────────────────
section('Migrating newsletter_subscribers...');
const subs = await fetchAll('newsletter_subscribers');
log(`Fetched ${subs.length} newsletter subscribers from Supabase`);

for (const r of subs) {
  await db.query(
    `INSERT IGNORE INTO newsletter_subscribers
       (id, email, name, locale, is_active, subscribed_at, unsubscribed_at, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id, r.email, r.name ?? null, r.locale ?? 'en',
      r.is_active ? 1 : 0, dt(r.subscribed_at),
      dt(r.unsubscribed_at), r.ip_hash ?? null,
    ]
  );
}
log(`✓ Inserted ${subs.length} newsletter subscribers`);

// ── 10. TRANSLATIONS UI ───────────────────────────────────────
section('Migrating translations_ui...');
const translations = await fetchAll('translations_ui');
log(`Fetched ${translations.length} translation entries from Supabase`);

for (const r of translations) {
  await db.query(
    `INSERT IGNORE INTO translations_ui
       (id, namespace, \`key\`, translations, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      r.id, r.namespace, r.key,
      j(r.translations), dt(r.created_at), dt(r.updated_at),
    ]
  );
}
log(`✓ Inserted ${translations.length} translation entries`);

// ── 11. ADMIN SETTINGS ────────────────────────────────────────
section('Migrating admin_settings...');
const settings = await fetchAll('admin_settings');
log(`Fetched ${settings.length} admin settings from Supabase`);

for (const r of settings) {
  await db.query(
    `INSERT INTO admin_settings (\`key\`, value, updated_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)`,
    [r.key, j(r.value), dt(r.updated_at)]
  );
}
log(`✓ Upserted ${settings.length} admin settings`);

// ── 12. SITEMAP CUSTOM ENTRIES ────────────────────────────────
section('Migrating sitemap_custom_entries...');
const sitemap = await fetchAll('sitemap_custom_entries');
log(`Fetched ${sitemap.length} sitemap entries from Supabase`);

for (const r of sitemap) {
  await db.query(
    `INSERT IGNORE INTO sitemap_custom_entries
       (id, url, priority, changefreq, last_modified, is_active, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id, r.url, r.priority ?? 0.5, r.changefreq ?? 'weekly',
      dt(r.last_modified), r.is_active ? 1 : 0,
      r.notes ?? null, dt(r.created_at), dt(r.updated_at),
    ]
  );
}
log(`✓ Inserted ${sitemap.length} sitemap entries`);

// ── 13. PRICE HISTORY ─────────────────────────────────────────
section('Migrating price_history...');
const prices = await fetchAll('price_history');
log(`Fetched ${prices.length} price history records from Supabase`);

for (const r of prices) {
  await db.query(
    `INSERT IGNORE INTO price_history (id, product_id, price_cents, currency, recorded_at)
     VALUES (?, ?, ?, ?, ?)`,
    [r.id, r.product_id, r.price_cents, r.currency ?? 'USD', dt(r.recorded_at)]
  );
}
log(`✓ Inserted ${prices.length} price history records`);

// ── Re-enable FK checks ───────────────────────────────────────
await db.query('SET FOREIGN_KEY_CHECKS = 1');

// ── Summary ───────────────────────────────────────────────────
section('Migration complete! Verifying row counts in MySQL...');
const tables = [
  'categories','products','product_images',
  'blog_categories','blog_posts','blog_tags','blog_post_tags','blog_comments',
  'newsletter_subscribers','translations_ui','admin_settings',
  'sitemap_custom_entries','price_history',
];
for (const t of tables) {
  const [[{ n }]] = await db.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
  log(`${t.padEnd(30)} ${n} rows`);
}

await db.end();
console.log('\n✅ All done.\n');
