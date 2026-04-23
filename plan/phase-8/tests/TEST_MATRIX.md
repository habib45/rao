# Phase 8 — Test Matrix

## Unit Tests: `_lib/utils/__tests__/slugify.test.ts`

| Test ID | Input | Expected Output |
|---|---|---|
| T8.1.1 | `"Hello World"` | `"hello-world"` |
| T8.1.2 | `"Café Latte"` | `"cafe-latte"` (NFD strip) |
| T8.1.3 | `"  leading spaces  "` | `"leading-spaces"` |
| T8.1.4 | `"multiple   spaces"` | `"multiple-spaces"` |
| T8.1.5 | `"already-hyphenated"` | `"already-hyphenated"` |
| T8.1.6 | `"--double--hyphens--"` | `"double-hyphens"` |
| T8.1.7 | `"special! @#$% chars"` | `"special-chars"` |
| T8.1.8 | `""` | `""` |
| T8.1.9 | `"123 numbers"` | `"123-numbers"` |
| T8.1.10 | Bengali characters | `""` (stripped) |
| T8.1.11 | Swedish `"Åsa Öberg"` | `"asa-oberg"` |
| T8.1.12 | All uppercase | Lowercased |
| T8.1.13 | Trailing hyphen from strip | No trailing hyphen |
| T8.1.14 | Mixed alphanumeric | Correct output |

## Schema Tests: `_lib/__tests__/schemas.test.ts`

### categorySchema (10 cases)
| T8.2.1 | Full valid object | passes |
| T8.2.2 | Minimal (en only) + defaults | sort_order=0, is_active=true |
| T8.2.3 | Missing name.en | ZodError |
| T8.2.4 | Empty name.en | ZodError |
| T8.2.5 | Non-UUID parent_id | ZodError |
| T8.2.6 | Valid UUID parent_id | passes |
| T8.2.7 | image_url "" → null | null |
| T8.2.8 | image_url null | passes |
| T8.2.9 | image_url "not-a-url" | ZodError |
| T8.2.10 | sort_order omitted → 0 | 0 |

### productUpdateSchema (8 cases)
| T8.3.1 | Full valid | passes |
| T8.3.2 | Missing name.en | ZodError |
| T8.3.3 | availability: "invalid" | ZodError |
| T8.3.4 | discount_pct: 101 | ZodError |
| T8.3.5 | discount_pct: -1 | ZodError |
| T8.3.6 | price_cents: null | passes |
| T8.3.7 | category_id: null | passes |
| T8.3.8 | currency omitted → "USD" | "USD" |

### translationUpdateSchema (10 cases)
| T8.4.1 | Valid updates array | passes |
| T8.4.2 | Empty array | passes |
| T8.4.3 | table: "users" | ZodError |
| T8.4.4 | locale: "de" | ZodError |
| T8.4.5 | id: "not-uuid" | ZodError |
| T8.4.6–8.4.10 | All valid tables/locales | passes |

## Auth Tests: `_lib/__tests__/auth.test.ts` (8 cases)

| Test ID | Description | Expected |
|---|---|---|
| T8.5.1 | getAdminUser with role="admin" | Returns user |
| T8.5.2 | getAdminUser with null user | Returns null |
| T8.5.3 | getAdminUser with no app_metadata | Returns null |
| T8.5.4 | getAdminUser with role="editor" | Returns null |
| T8.5.5 | requireAdmin with admin user | Returns user |
| T8.5.6 | requireAdmin with null | Calls redirect("/admin/login") |
| T8.5.7 | requireAdmin with editor role | Calls redirect("/admin/login") |
| T8.5.8 | getUser throws | Returns null |

## Component Tests (13 cases)

### StatsCard.test.tsx (6 cases)
| T8.6.1–6 | title, value, description, no-description, icon, numeric value | Correct render |

### ProductFilters.test.tsx (7 cases)
| T8.7.1 | Renders search input | Present |
| T8.7.2 | Renders category options | Correct options |
| T8.7.3 | Renders status options | All/Active/Inactive |
| T8.7.4 | Typing after 300ms calls onFilterChange | Called with {search:"tv",...} |
| T8.7.5 | Typing faster than 300ms doesn't call | Not called |
| T8.7.6 | Selecting category calls onFilterChange | Called with category id |
| T8.7.7 | Status select calls onFilterChange | Called with status |

## API Route Tests

### categories.test.ts (9 cases)
- GET → 200 with list
- GET Supabase error → 500
- POST valid → 201
- POST missing name.en → 400
- POST invalid parent_id → 400
- POST empty image_url → null in insert arg
- PATCH valid partial → 200
- PATCH invalid parent_id → 400
- DELETE → 200 with ok:true, calls update({is_active:false})

### products.test.ts (7 cases)
- PATCH valid partial → 200
- PATCH missing name.en → 400
- PATCH invalid availability → 400
- PATCH discount_pct 150 → 400
- DELETE → 200 ok:true
- PATCH Supabase error → 500
- DELETE Supabase error → 500

## Middleware Tests: `src/__tests__/middleware.test.ts` (10 cases)

| T8.8.1 | /admin/login → passes through | NextResponse.next() |
| T8.8.2 | /admin/api/* → passes through | NextResponse.next() |
| T8.8.3 | /admin/dashboard unauthenticated → redirect | /admin/login |
| T8.8.4 | /admin/dashboard role="editor" → redirect | /admin/login |
| T8.8.5 | /admin/dashboard role="admin" → passes | NextResponse.next() |
| T8.8.6 | /en/products → intl middleware | Delegated |
| T8.8.7 | /bn-BD → intl middleware | Delegated |
| T8.8.8 | /sv → intl middleware | Delegated |
| T8.8.9 | / (root) → intl middleware | Delegated |
| T8.8.10 | matcher excludes _next paths | Not matched |
