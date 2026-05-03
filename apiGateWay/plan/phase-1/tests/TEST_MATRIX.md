# Phase 1 — Test Matrix

## Status: ✅ Manually verified (automated tests planned for Phase 6)

## Connection & Health

| ID | Test | Method | URL | Expected | Result |
|---|---|---|---|---|---|
| T1.1 | DB connected | GET | /health | `{ status: "ok", db: "connected" }` | ✅ Pass |
| T1.2 | 404 on unknown route | GET | /api/unknown | `404 { error: "Not found" }` | ✅ Pass |

## Categories

| ID | Test | Method | URL | Expected | Result |
|---|---|---|---|---|---|
| T1.3 | Empty list | GET | /api/categories | `[]` | ✅ Pass |
| T1.4 | Missing required fields | POST | /api/categories | `400` | — |
| T1.5 | Not found | GET | /api/categories/bad-id | `404` | — |

## Products

| ID | Test | Method | URL | Expected | Result |
|---|---|---|---|---|---|
| T1.6 | Empty list with pagination | GET | /api/products | `{ data: [], total: 0, limit: 20, offset: 0 }` | ✅ Pass |
| T1.7 | Filter by status | GET | /api/products?status=draft | filtered result | — |
| T1.8 | Search English | GET | /api/products?search=laptop&locale=en | FULLTEXT result | — |
| T1.9 | ASIN lookup | GET | /api/products/asin/B001234 | product or 404 | — |
| T1.10 | Comparison list | GET | /api/products/comparison/list | products with show_in_comparison=true | — |

## Admin Auth

| ID | Test | Method | URL | Headers | Expected | Result |
|---|---|---|---|---|---|---|
| T1.11 | No API key | GET | /api/admin/dashboard | — | `401` | ✅ Pass |
| T1.12 | Wrong API key | GET | /api/admin/dashboard | `x-api-key: wrong` | `401` | — |
| T1.13 | Valid API key | GET | /api/admin/dashboard | `x-api-key: change-me-in-production` | `200` stats object | ✅ Pass |

## Admin Dashboard

| ID | Test | Method | URL | Expected | Result |
|---|---|---|---|---|---|
| T1.14 | Dashboard shape | GET | /api/admin/dashboard | has keys: products, categories, clicks_today, subscribers, blog_posts, top_products_7d | ✅ Pass |

## Newsletter

| ID | Test | Method | URL | Expected | Result |
|---|---|---|---|---|---|
| T1.15 | Subscribe new email | POST | /api/newsletter/subscribe | `201 { success: true }` | — |
| T1.16 | Subscribe duplicate | POST | /api/newsletter/subscribe | `409 Already subscribed` | — |
| T1.17 | Unsubscribe | POST | /api/newsletter/unsubscribe | `200 { success: true }` | — |
| T1.18 | Resubscribe after unsub | POST | /api/newsletter/subscribe | `200 { success: true, resubscribed: true }` | — |

## How to Run Manual Tests

```bash
cd apiGateWay
npm run dev

# Health
curl http://localhost:4000/health

# Products
curl http://localhost:4000/api/products

# Admin (with key)
curl -H "x-api-key: change-me-in-production" http://localhost:4000/api/admin/dashboard

# Admin (no key - expect 401)
curl http://localhost:4000/api/admin/dashboard
```
