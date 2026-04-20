# Phase 2 — Database Schema & Migrations

## Objective

Create the full Supabase PostgreSQL schema with tables, indexes, RLS policies, triggers, and seed data. All SQL lives in `supabase/migrations/` as timestamped migration files ready for `supabase db push`.

---

## Feature List

| ID | Feature | Priority | Complexity | Document |
|---|---|---|---|---|
| F2.1 | Core Tables Migration | P0 | High | [features/F2.1-core-tables.md](features/F2.1-core-tables.md) |
| F2.2 | Indexes (GIN, tsvector, B-tree) | P0 | Medium | [features/F2.2-indexes.md](features/F2.2-indexes.md) |
| F2.3 | Row Level Security Policies | P0 | Medium | [features/F2.3-rls-policies.md](features/F2.3-rls-policies.md) |
| F2.4 | Triggers & Functions | P0 | Low | [features/F2.4-triggers.md](features/F2.4-triggers.md) |
| F2.5 | Seed Data | P1 | Low | [features/F2.5-seed-data.md](features/F2.5-seed-data.md) |

---

## Dependency Order

```
F2.1 (Core Tables)
 ├── F2.2 (Indexes)      ← requires tables
 ├── F2.3 (RLS Policies) ← requires tables
 └── F2.4 (Triggers)     ← requires tables
      └── F2.5 (Seed Data) ← requires all schema
```

**Implementation order:** F2.1 → F2.2 → F2.3 → F2.4 → F2.5

---

## Tables (7 total)

| Table | Source Type | Key Columns |
|---|---|---|
| categories | Category | id, name (JSONB), slug (JSONB), parent_id (self-ref FK) |
| products | Product | id, asin (unique), category_id (FK), name/slug/desc (JSONB), price_cents |
| product_images | ProductImage | id, product_id (FK), url, alt_text (JSONB), sort_order |
| click_tracking | ClickEvent | id, product_id (FK), locale, session_id, ip_hash |
| cart_items | CartItem | id, session_id, product_id (FK), quantity |
| price_history | PriceHistoryEntry | id, product_id (FK), price_cents, currency, recorded_at |
| translations_ui | (new) | id, namespace, key, translations (JSONB) |

---

## Test Strategy

Since we cannot run Supabase locally in CI, tests validate:
1. Migration SQL files exist and parse correctly
2. All 7 tables are defined with correct columns
3. JSONB columns have GIN indexes
4. RLS is enabled on all tables
5. Trigger functions exist
6. Seed data is valid JSON/SQL
7. Schema matches TypeScript domain types

Test files: `src/__tests__/schema.test.ts`

---

## Acceptance Criteria

- [ ] All 7 tables defined in migration SQL
- [ ] All JSONB columns have GIN indexes
- [ ] tsvector columns exist for FTS on products and categories
- [ ] RLS enabled on all tables with appropriate policies
- [ ] `updated_at` auto-updates via trigger on mutable tables
- [ ] Seed data covers all tables with realistic test data
- [ ] All schema validation tests pass
- [ ] TypeScript types align with database columns
- [ ] No secrets in migration files

---

## File Structure After Phase 2

```
supabase/
├── migrations/
│   ├── 00001_create_tables.sql
│   ├── 00002_create_indexes.sql
│   ├── 00003_enable_rls.sql
│   ├── 00004_create_triggers.sql
│   └── 00005_seed_data.sql
src/
├── __tests__/
│   └── schema.test.ts
```
