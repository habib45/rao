# Phase 1 — Foundation: MySQL Schema + Express API Gateway

## Goal
Convert the full ORH BestFinds Supabase/PostgreSQL schema to MySQL 8.0 and build a standalone Express.js REST API gateway that serves all data to the Next.js frontend and admin panel.

## Status: ✅ COMPLETE

## Scope Decisions

| Decision | Choice |
|---|---|
| Runtime | Node.js ESM (`"type": "module"`) |
| Framework | Express.js 4 |
| DB driver | mysql2 (promise pool) |
| Auth | Static API key via `x-api-key` header (admin routes only) |
| UUID generation | `crypto.randomUUID()` — Node.js built-in, no dependency |
| JSON fields | Stored as MySQL `JSON` type, serialized on write, parsed by driver on read |
| Full-text search | MySQL `FULLTEXT` indexes on denormalized generated columns |
| RLS | Dropped — enforced at API route layer instead |
| Port | 4000 |

## Features

| ID | Feature | Status |
|---|---|---|
| F1.1 | MySQL schema — 17 tables converted from Supabase migrations | ✅ |
| F1.2 | DB connection pool (`src/db/connection.js`) | ✅ |
| F1.3 | Express app entry point with CORS + JSON middleware | ✅ |
| F1.4 | `GET /health` — live DB ping endpoint | ✅ |
| F1.5 | Categories router — GET list, GET :id, POST, PATCH, DELETE | ✅ |
| F1.6 | Products router — CRUD + images + comparison + ASIN lookup + FULLTEXT search | ✅ |
| F1.7 | Blog router — posts, categories, tags, comments | ✅ |
| F1.8 | Newsletter router — subscribe, unsubscribe, list subscribers | ✅ |
| F1.9 | Tracking router — click record, per-product history, aggregated summary | ✅ |
| F1.10 | Admin router — settings, dashboard stats, sync logs, translations, price history, sitemap entries, scheduled publish | ✅ |
| F1.11 | API key middleware for `/api/admin/*` routes | ✅ |
| F1.12 | Global error handler + 404 fallback | ✅ |
| F1.13 | `.env` config (DB creds, PORT, API_SECRET) | ✅ |

## File Structure

```
apiGateWay/
├── src/
│   ├── index.js                 ← Express app, route mounting, error handling
│   ├── db/
│   │   └── connection.js        ← mysql2 pool (connectionLimit: 10, timezone: Z)
│   ├── middleware/
│   │   └── auth.js              ← requireApiKey() — checks x-api-key header
│   ├── routes/
│   │   ├── categories.js        ← /api/categories — CRUD (5 routes)
│   │   ├── products.js          ← /api/products — CRUD + images + comparison (10 routes)
│   │   ├── blog.js              ← /api/blog — posts/categories/tags/comments (12 routes)
│   │   ├── newsletter.js        ← /api/newsletter — subscribe/unsubscribe/list (3 routes)
│   │   ├── tracking.js          ← /api/tracking — clicks + summary (3 routes)
│   │   └── admin.js             ← /api/admin — settings/dashboard/sync-logs/etc (13 routes)
│   └── utils/
│       └── uuid.js              ← newId() wrapper around crypto.randomUUID()
├── mysql/
│   └── schema.sql               ← Full MySQL 8.0 DDL (17 tables, indexes, seed data)
├── .env                         ← DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT, API_SECRET
└── package.json                 ← dependencies: express, mysql2, cors, dotenv, zod
```

## MySQL Tables Created

| Table | Source Migration | Notes |
|---|---|---|
| `categories` | 00001 | `parent_id` self-reference FK |
| `products` | 00001, 00008, 00009, 00010, 00020 | Generated columns for FULLTEXT, ENUM status |
| `product_images` | 00001 | CASCADE delete on product |
| `click_tracking` | 00001 | ENUM locale |
| `cart_items` | 00001 | UNIQUE(session_id, product_id) |
| `price_history` | 00001 | Append-only |
| `translations_ui` | 00001 | UNIQUE(namespace, key) |
| `admin_settings` | 00006 | Primary key is `key` TEXT, seeded with defaults |
| `sync_logs` | 00006 | ENUM status |
| `blog_categories` | 00011 | |
| `blog_posts` | 00011 | FULLTEXT on content, ENUM status |
| `blog_tags` | 00011 | |
| `blog_post_tags` | 00011 | Composite PK many-to-many |
| `blog_post_views` | 00011 | |
| `blog_comments` | 00011 | Self-reference parent_id |
| `sitemap_custom_entries` | 00013 | ENUM changefreq |
| `newsletter_subscribers` | 00014 | UNIQUE email |

## Acceptance Criteria

- [x] `mysql -u root -pbs23 orh_bestfinds -e "SHOW TABLES;"` returns all 17 tables
- [x] `GET /health` returns `{ status: "ok", db: "connected" }`
- [x] `GET /api/products` returns `{ data: [], total: 0, limit: 20, offset: 0 }`
- [x] `GET /api/admin/dashboard` with valid `x-api-key` returns stats object
- [x] `GET /api/admin/dashboard` without `x-api-key` returns `401 Unauthorized`
- [x] Server starts on port 4000 with no errors

## How to Run

```bash
cd apiGateWay
npm install
npm run dev      # node --watch src/index.js
```

Environment variables in `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=bs23
DB_NAME=orh_bestfinds
PORT=4000
API_SECRET=change-me-in-production
```
