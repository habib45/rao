# Security Policy

This document describes the security model, secrets, and operational
assumptions for the **orh** (Outdoor Gear Lab) Next.js application.
It is the authoritative reference for what an operator must configure before
running this app in production.

If you find a vulnerability, please report it privately (see
[Reporting a vulnerability](#reporting-a-vulnerability) below).

---

## Threat model

The application is a public-facing product comparison and review site with a
small admin surface for editing products, categories, blog posts, and AI
endpoints. We assume:

- The internet at large is hostile (credential stuffing, scraping, SSRF).
- The hosting platform terminates TLS and forwards real client IPs via
  `x-forwarded-for` / `x-real-ip`.
- The Express / MySQL API gateway runs on the same trusted network as the
  Next.js server.
- The admin UI is operated by a small team with named accounts.

Out of scope: DDoS at the network edge, browser extensions, client-side
JavaScript bugs in third-party CKEditor bundles.

---

## Authentication

### Admin sessions — JWT (HS256)

Admin authentication is stateless and edge-compatible. There is **no
server-side session store**.

| Aspect        | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Algorithm     | HS256 (`jose` library, runs on the Edge runtime)       |
| Issuer / aud  | `orh-admin` / `orh-admin`                              |
| Default TTL   | 1 hour; 30 days if "remember me" was chosen at login   |
| Cookie name   | `admin_token`                                          |
| Signing key   | `ADMIN_JWT_SECRET` (server-only)                       |

The signing key is read lazily on every request. On the **edge middleware**
(`src/middleware.ts`) the same secret is used to verify the token before any
admin page or API route runs. Inside the Node.js runtime, `withAdmin()` is the
defence-in-depth wrapper that re-verifies the token on every handler.

### Roles

Two roles are issued at login and embedded in the JWT:

- `admin` — full access to all admin routes.
- `editor` — same access as `admin` for the current implementation; reserved
  as a distinct role so future restrictions can be added without a token
  format change.

Anything else is rejected as `403 Forbidden` by `withAdmin()`.

### Cookie attributes

The session cookie is set by `adminSessionCookieAttributes()`:

| Attribute   | Value                                        |
| ----------- | -------------------------------------------- |
| `httpOnly`  | `true` (no JS access)                        |
| `secure`    | `true` in production, `false` in dev         |
| `sameSite`  | `lax` (blocks cross-site POSTs)              |
| `path`      | `/`                                          |
| `maxAge`    | login = 1 day; remember me = 30 days         |

The session cookie is **never** exposed to `document.cookie` (httpOnly), so
XSS cannot steal it. `sameSite=lax` blocks the cookie from being sent on
cross-site form POSTs and top-level cross-site GETs, which mitigates CSRF for
state-changing requests.

### Defence in depth

Both layers verify the JWT independently:

1. **Edge middleware** (`src/middleware.ts → handleAdminAuth`) — fast path
   that blocks unauthenticated traffic before route handlers run. Returns
   `307` redirects for pages and `401 JSON` for `/admin/api/*` paths.
2. **`withAdmin()` wrapper** — used inside every admin route handler. Even
   if the matcher config is misconfigured, the route still rejects
   unauthenticated calls.

---

## Required environment variables

| Variable                  | Where     | Required in prod | Notes                                              |
| ------------------------- | --------- | ---------------- | -------------------------------------------------- |
| `ADMIN_JWT_SECRET`        | Server    | **Yes**          | HS256 signing key. 32+ random bytes, base64/hex.   |
| `MYSQL_API_SECRET`        | Server    | **Yes**          | `x-api-key` header to the Express gateway.         |
| `MYSQL_API_JWT_TOKEN`     | Server    | **Yes**          | Upstream identity JWT for the gateway.             |
| `MYSQL_JWT_SECRET`        | Server    | Per gateway      | Used by the gateway to mint its own tokens.        |
| `API_TOKEN`               | Server    | Per feature      | Optional external API token.                       |
| `AMAZON_*`                | Server    | Per feature      | PA-API credentials (scraper).                      |
| `GEMINI_API_KEY`          | Server    | Per feature      | Google Gemini key.                                 |
| `OPENAI_API_KEY`          | Server    | Per feature      | OpenAI key.                                        |
| `GROQ_API_KEY`            | Server    | Per feature      | Groq key.                                          |
| `SSRF_ALLOWED_HOSTNAMES`  | Server    | Optional         | Comma-separated allowlist for the SSRF guard.      |
| `NEXT_PUBLIC_SITE_URL`    | Client    | Yes              | Used for canonical / OG URLs.                      |
| `NEXT_PUBLIC_MYSQL_API_URL` | Client  | No               | Public URL of the gateway (no secrets).             |

### Boot guards

The application **refuses to start in production** if:

- `ADMIN_JWT_SECRET` is unset or equals the development fallback
  (`dev-only-not-for-production`).
- `MYSQL_API_SECRET` is unset.
- `MYSQL_API_JWT_TOKEN` is unset.

This is enforced at module-load time (`src/app/admin/_lib/jwt.ts`,
`src/lib/config/datasource.ts`). There is no default secret that works in
production.

### Secret generation

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Generate one secret per environment. Never reuse a secret across environments.
Never commit `.env` or `.env.local` to source control.

### What `.env.example` looks like

`.env.example` ships with **empty values** for every secret. The config test
suite (`src/__tests__/config.test.ts`) explicitly asserts that no real secret
is committed in the example file.

---

## Network egress and SSRF guard

Three routes fetch external URLs on behalf of the admin: the Amazon PA-API
scraper, the blog scraper, and the AI-powered product description endpoint.
Each is wrapped in `assertSafeUrl()` (`src/lib/api/ssrf.ts`), which:

1. Rejects non-`http(s)` schemes (`file:`, `gopher:`, etc.).
2. Rejects hostnames matching `localhost`, `*.local`, `*.internal`,
   `metadata.google.internal`, and other cloud-metadata names.
3. Resolves the hostname via `dns/promises` and rejects the request if **any**
   returned A/AAAA record points to:
   - IPv4 loopback (`127.0.0.0/8`)
   - IPv4 RFC1918 private space (`10/8`, `172.16/12`, `192.168/16`)
   - IPv4 link-local (`169.254.0.0/16`) — covers cloud metadata services
   - `0.0.0.0/8`
   - IPv6 loopback (`::1`)
   - IPv4-mapped IPv6 (`::ffff:127.0.0.1`, `::ffff:10.0.0.1`, …)
4. Optionally allows the hostname without DNS check if it is listed in the
   `SSRF_ALLOWED_HOSTNAMES` env var (comma-separated). This is for trusted
   CDN/proxy hosts that have their own egress controls.

A request that fails the check returns `400 Bad Request` and **never** makes
the outbound HTTP call.

### Image proxy allowlist

Next.js `<Image>` proxying is restricted to a fixed list of hostnames in
`next.config.js → images.remotePatterns`. Anything outside that list is
rejected by the framework. When adding a new CDN, append one explicit entry;
do not introduce wildcards.

---

## Rate limiting

`withRateLimit()` (`src/lib/api/rate-limit.ts`) is an in-memory token bucket.
It is currently applied to:

- `/admin/api/auth/login` — login throttling.
- `/admin/api/ai/*` — AI generation throttling.

| Property            | Value                                        |
| ------------------- | -------------------------------------------- |
| Algorithm           | Token bucket (refill-based)                  |
| Identifier          | First entry in `x-forwarded-for`, else `x-real-ip`, else `unknown` |
| Storage             | Per-process `Map` — not shared across pods   |
| Failure mode        | Returns `429` with the standard error envelope |

**Operational note:** because the limiter is in-memory, behind a load balancer
with N replicas, effective limits are N× the configured value. For
multi-pod deployments, swap the implementation for a shared store (Redis)
before relying on these limits as a security control.

The identifier is **trusted to be set by the upstream proxy**. If you do not
terminate at a known proxy that strips inbound `x-forwarded-for`, an attacker
can spoof their bucket key.

---

## Error envelope

All admin API routes return errors in a stable JSON envelope so clients
(including admin UI) do not need to parse HTML or unstructured text:

| Status | Body                                  |
| ------ | ------------------------------------- |
| 400    | `{ "error": "Bad Request" }`          |
| 401    | `{ "error": "Unauthorized" }`         |
| 403    | `{ "error": "Forbidden" }`            |
| 429    | `{ "error": "Too Many Requests", "key": "<bucket>" }` |
| 500    | `{ "error": "Internal Server Error" }` |

Errors never include the underlying exception message in production. The
internal message is logged but not echoed to the client.

---

## Transport security

- HTTPS is enforced in production by the edge middleware via
  `x-forwarded-proto`. Any non-HTTPS request to a non-`/admin` page is
  upgraded; `/admin/*` requires HTTPS unconditionally.
- Cookies are marked `secure` in production.
- HSTS is configured at the reverse proxy / CDN layer (out of scope for this
  app).

---

## Trusted proxy assumptions

The application relies on the following being true of its deployment:

- TLS is terminated upstream (load balancer, CDN, or reverse proxy).
- The upstream sets `x-forwarded-proto` to `https` for TLS-terminated
  requests.
- The upstream sets `x-forwarded-for` and / or `x-real-ip` to the real
  client IP for rate-limiting and audit logs.
- The upstream strips inbound `x-forwarded-*` headers from external traffic.

If you do not control the layer in front of the app, do not deploy to the
public internet.

---

## API gateway (Express / MySQL)

The Next.js app does not talk to MySQL directly. All queries are routed
through the local Express gateway. The gateway receives:

- `Authorization: Bearer ${MYSQL_API_JWT_TOKEN}` — identity for the calling
  domain. Required for every request.
- `x-api-key: ${MYSQL_API_SECRET}` — required for admin-only routes.

`NEXT_PUBLIC_MYSQL_API_JWT_TOKEN` is **not** used anywhere in `src/`. The
public-side value is, by design, never bundled to the client. See
`src/__tests__/config.test.ts` for the regression assertion.

---

## Reporting a vulnerability

Please **do not** file public issues for security problems. Email
`security@outdoorgearlab.example` with a description, reproduction steps, and
the impact you believe it has. We aim to acknowledge within 2 business days
and triage within 5.

---

## Security checklist for operators

Before deploying to production:

- [ ] Set `ADMIN_JWT_SECRET` to a freshly generated 32+ byte secret.
- [ ] Set `MYSQL_API_SECRET` and `MYSQL_API_JWT_TOKEN` to gateway-issued
      values; remove all dev fallback strings.
- [ ] Set `SSRF_ALLOWED_HOSTNAMES` only if you need to allowlist an internal
      host; leave empty otherwise.
- [ ] Confirm the upstream proxy terminates TLS, sets
      `x-forwarded-proto=https`, and strips inbound `x-forwarded-*`.
- [ ] Confirm `next.config.js → images.remotePatterns` matches the CDNs you
      actually serve images from.
- [ ] Confirm rate-limit math for multi-pod deployments (or move to Redis).
- [ ] Confirm `.env`, `.env.local`, and any secret-bearing file is in
      `.gitignore`.
- [ ] Confirm `npm test` passes (`npx vitest run`); confirm pre-existing
      failures are understood.