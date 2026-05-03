# ORH API Gateway — Master Development Plan

## Project Overview

A standalone Express.js REST API gateway that serves the ORH / BestFinds platform data from a **MySQL 8.0** database. This is a **separate backend service** — decoupled from the Next.js frontend and Supabase. It provides full CRUD, analytics, admin controls, and public read endpoints.

**Stack:** Node.js (ESM) | Express.js 4 | MySQL 8.0 | mysql2 | Zod | dotenv  
**Port:** 4000 (configurable via `PORT` env var)  
**Auth:** API key (`x-api-key` header) on all `/api/admin/*` routes  
**Database:** `orh_bestfinds` on localhost:3306

---

## Architecture

```
apiGateWay/
├── src/
│   ├── index.js              ← App entry, route mounting, error handling
│   ├── db/connection.js      ← MySQL2 connection pool
│   ├── middleware/auth.js    ← x-api-key guard for admin routes
│   ├── routes/
│   │   ├── categories.js     ← GET/POST/PATCH/DELETE
│   │   ├── products.js       ← CRUD + images + comparison + search
│   │   ├── blog.js           ← posts / categories / tags / comments
│   │   ├── newsletter.js     ← subscribe / unsubscribe / list
│   │   ├── tracking.js       ← click events + analytics summary
│   │   └── admin.js          ← settings / dashboard / sync logs / translations
│   └── utils/uuid.js         ← crypto.randomUUID() wrapper
├── mysql/
│   └── schema.sql            ← Full MySQL 8.0 schema (17 tables)
├── plan/                     ← This directory
├── .env                      ← DB credentials + API secret
└── package.json
```

---

## API Route Map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | DB connectivity check |
| GET | `/api/categories` | Public | List active categories |
| GET | `/api/categories/:id` | Public | Single category |
| POST | `/api/categories` | Public* | Create category |
| PATCH | `/api/categories/:id` | Public* | Update category |
| DELETE | `/api/categories/:id` | Public* | Delete category |
| GET | `/api/products` | Public | List products (filter, search, paginate) |
| GET | `/api/products/:id` | Public | Single product with images |
| GET | `/api/products/asin/:asin` | Public | Lookup by ASIN |
| POST | `/api/products` | Public* | Create product |
| PATCH | `/api/products/:id` | Public* | Update product |
| DELETE | `/api/products/:id` | Public* | Delete product |
| GET | `/api/products/:id/images` | Public | Product images |
| POST | `/api/products/:id/images` | Public* | Add image |
| GET | `/api/products/comparison/list` | Public | Comparison-enabled products |
| GET | `/api/blog/posts` | Public | List blog posts |
| GET | `/api/blog/posts/:id` | Public | Single post with tags |
| POST | `/api/blog/posts` | Public* | Create post |
| PATCH | `/api/blog/posts/:id` | Public* | Update post |
| DELETE | `/api/blog/posts/:id` | Public* | Delete post |
| GET | `/api/blog/posts/:id/comments` | Public | Approved comments |
| POST | `/api/blog/posts/:id/comments` | Public | Submit comment |
| GET | `/api/blog/categories` | Public | Blog categories |
| POST | `/api/blog/categories` | Public* | Create blog category |
| GET | `/api/blog/tags` | Public | All tags |
| POST | `/api/blog/tags` | Public* | Create tag |
| POST | `/api/newsletter/subscribe` | Public | Subscribe |
| POST | `/api/newsletter/unsubscribe` | Public | Unsubscribe |
| GET | `/api/newsletter/subscribers` | Public* | List subscribers |
| POST | `/api/tracking/click` | Public | Record click |
| GET | `/api/tracking/clicks/:product_id` | Public* | Clicks for product |
| GET | `/api/tracking/summary` | Public* | Aggregated click stats |
| GET | `/api/admin/settings` | **Admin** | All settings |
| GET | `/api/admin/settings/:key` | **Admin** | Single setting |
| PUT | `/api/admin/settings/:key` | **Admin** | Upsert setting |
| GET | `/api/admin/dashboard` | **Admin** | Summary stats |
| GET | `/api/admin/sync-logs` | **Admin** | Sync log history |
| POST | `/api/admin/sync-logs` | **Admin** | Insert sync log |
| GET | `/api/admin/translations` | **Admin** | All UI translations |
| PUT | `/api/admin/translations/:ns/:key` | **Admin** | Upsert translation |
| GET | `/api/admin/price-history/:id` | **Admin** | Price history for product |
| POST | `/api/admin/price-history` | **Admin** | Record price snapshot |
| POST | `/api/admin/publish-scheduled` | **Admin** | Activate due drafts |
| GET | `/api/admin/sitemap-entries` | **Admin** | Sitemap custom entries |
| POST | `/api/admin/sitemap-entries` | **Admin** | Add sitemap entry |
| DELETE | `/api/admin/sitemap-entries/:id` | **Admin** | Remove entry |

*Routes marked Public* should be moved behind the admin API key in production.

---

## Development Phases

### Phase 1: Foundation — MySQL Schema + Express Gateway ✅ COMPLETE
**Goal:** Convert Supabase PostgreSQL schema to MySQL 8.0, build Express.js REST API with full CRUD for all 17 tables.  
**Deliverables:**
- MySQL schema (`mysql/schema.sql`) — 17 tables, FULLTEXT indexes, ENUMs, FK constraints
- Express server with CORS, JSON body parsing, global error handler
- Routes: categories, products, blog, newsletter, tracking, admin
- API key middleware for admin routes
- Health check endpoint with live DB ping
- `.env` configuration

**Dependencies:** MySQL 8.0 running locally

### Phase 2: Validation & Error Hardening 📋 Planned
**Goal:** Add Zod schema validation to all POST/PATCH routes. Standardize error responses.  
**Deliverables:**
- Zod schemas for all route inputs
- 400 responses with structured `{ error, issues }` on validation failure
- Input sanitization on all user-facing endpoints

### Phase 3: Authentication & Security 📋 Planned
**Goal:** Harden the gateway for production. Move write operations behind API key.  
**Deliverables:**
- All POST/PATCH/DELETE behind `x-api-key` guard
- Rate limiting (express-rate-limit)
- Helmet.js security headers
- IP hashing for click tracking and newsletter

### Phase 4: Cart Sync API 📋 Planned
**Goal:** Expose cart_items as a server-side API (currently localStorage-only in Next.js).  
**Deliverables:**
- GET/POST/PATCH/DELETE `/api/cart/:session_id`
- Session-based cart persistence in MySQL

### Phase 5: Cron / Scheduled Jobs 📋 Planned
**Goal:** Replace Supabase Edge Function crons with Express-based scheduled jobs.  
**Deliverables:**
- `node-cron` jobs for `publish-scheduled` (hourly) and price history snapshots
- Cron status logged to `sync_logs` table

### Phase 6: Testing 📋 Planned
**Goal:** Unit + integration tests for all routes.  
**Deliverables:**
- Vitest or Jest test suite
- Supertest for HTTP integration tests
- Test database seeding helpers
