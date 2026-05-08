# Deployment Guide — raofindes.com (Namecheap Shared Hosting + MySQL)

## Important Reality Check First

Your project uses **Next.js 15 App Router with Server Components, API routes, and Supabase**.
Namecheap shared hosting runs **Phusion Passenger** for Node.js — it works, but has hard limits:

| Feature | Status on Shared Hosting |
|---|---|
| Next.js SSR / API routes | Works via Passenger |
| Server Components | Works |
| MySQL (via cPanel) | Works — provided natively |
| Supabase Auth | Must be replaced |
| Supabase Edge Functions | Must be converted to Next.js API routes |
| Supabase Storage | Must be replaced (local disk or Cloudinary) |
| ISR / `revalidate` | Limited — Passenger restarts worker per request |
| WebSockets | Not supported |

> **Bottom line:** This deployment requires migrating from Supabase to MySQL + a MySQL-compatible
> auth solution. Plan for 3–5 days of migration work before deploying.

---

## Phase 1 — MySQL Database Setup on Namecheap cPanel

### Step 1: Create MySQL Database

1. Log in to cPanel at `cpanel.raofindes.com` (or the URL in your Namecheap welcome email)
2. Go to **MySQL Databases**
3. Create database: `raofindes_db`
4. Create user: `raofindes_user` with a strong password
5. Click **Add User to Database** → grant **ALL PRIVILEGES**
6. Note your connection details:

```
Host:     localhost   (on shared hosting, always localhost)
Database: raofindes_db
User:     raofindes_user
Password: <your_password>
Port:     3306
```

### Step 2: Create MySQL Schema

In cPanel → **phpMyAdmin**, run this SQL to recreate your Supabase schema:

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name_en VARCHAR(255) NOT NULL,
  name_bn VARCHAR(255),
  name_sv VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  asin VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  image_url VARCHAR(500),
  affiliate_url TEXT,
  category_id VARCHAR(36),
  status ENUM('draft','pending','approved','rejected','scheduled') DEFAULT 'draft',
  scheduled_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  locale VARCHAR(10) DEFAULT 'en',
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE click_events (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36),
  session_id VARCHAR(100),
  ip_hash VARCHAR(64),
  locale VARCHAR(10),
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE translations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  field VARCHAR(100) NOT NULL,
  value TEXT,
  UNIQUE KEY unique_translation (entity_type, entity_id, locale, field)
);
```

---

## Phase 2 — Code Migration (Supabase → MySQL)

### Step 1: Install MySQL packages

```bash
npm install mysql2 next-auth bcryptjs
npm install --save-dev @types/bcryptjs
```

Remove Supabase packages:

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

### Step 2: Create MySQL client

Create `src/lib/db/mysql.ts`:

```ts
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT ?? 3306),
  waitForConnections: true,
  connectionLimit: 5,   // shared hosting: keep this low
  queueLimit: 0,
  ssl: false,           // localhost on shared hosting = no SSL needed
});

export default pool;
```

### Step 3: Replace Supabase query helpers

Create `src/lib/queries/products.ts`:

```ts
import pool from "@/lib/db/mysql";
import type { Product } from "@/types/domain";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const [rows] = await pool.execute(
    "SELECT * FROM products WHERE slug = ? AND status = 'approved' LIMIT 1",
    [slug]
  );
  const results = rows as Product[];
  return results[0] ?? null;
}

export async function getProducts(locale: string, limit = 20, offset = 0) {
  const [rows] = await pool.execute(
    `SELECT * FROM products
     WHERE status = 'approved' AND (locale = ? OR locale = 'en')
     ORDER BY published_at DESC
     LIMIT ? OFFSET ?`,
    [locale, limit, offset]
  );
  return rows as Product[];
}
```

### Step 4: Replace Supabase Auth with NextAuth.js

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db/mysql";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [rows] = await pool.execute(
          "SELECT * FROM users WHERE email = ? LIMIT 1",
          [credentials.email]
        );
        const users = rows as Array<{
          id: string;
          email: string;
          password_hash: string;
          role: string;
        }>;
        const user = users[0];
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
```

### Step 5: Create an admin user in MySQL

Run this in phpMyAdmin (replace the password hash):

```bash
# Generate hash locally first
node -e "const b=require('bcryptjs'); b.hash('YourAdminPassword',12).then(console.log)"
```

Then in phpMyAdmin:

```sql
INSERT INTO users (id, email, password_hash, role)
VALUES (UUID(), 'your@email.com', '<paste_hash_here>', 'admin');
```

### Step 6: Convert Supabase Edge Functions → API routes

Each Supabase Edge Function becomes a Next.js API route under `src/app/api/`.

**Click tracking example** — `src/app/api/track-click/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db/mysql";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { productId } = await req.json();
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

  await pool.execute(
    "INSERT INTO click_events (id, product_id, ip_hash) VALUES (UUID(), ?, ?)",
    [productId, ipHash]
  );

  return NextResponse.json({ ok: true });
}
```

**Amazon PA-API proxy example** — `src/app/api/amazon/search/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
// Move your existing PA-API SigV4 logic here from the Supabase Edge Function

export async function POST(req: NextRequest) {
  const { keywords } = await req.json();
  // ... your existing PA-API fetch logic
  return NextResponse.json({ items: [] });
}
```

### Step 7: Replace Supabase image hostname in next.config.ts

Remove the Supabase hostname and add your own domain:

```ts
// next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
    { protocol: "https", hostname: "m.media-amazon.com" },
    { protocol: "https", hostname: "www.raofindes.com" }, // your own uploads
    // remove: cjyjsagxcabwzvrlfizs.supabase.co
  ],
},
```

---

## Phase 3 — Environment Variables

### Local `.env.local`

```bash
# MySQL
DB_HOST=localhost
DB_USER=raofindes_user
DB_PASSWORD=your_strong_password
DB_NAME=raofindes_db
DB_PORT=3306

# NextAuth
NEXTAUTH_SECRET=generate_with_command_below
NEXTAUTH_URL=https://www.raofindes.com

# Amazon PA-API
AMAZON_ACCESS_KEY=your_key
AMAZON_SECRET_KEY=your_secret
AMAZON_PARTNER_TAG=your_tag
AMAZON_HOST=webservices.amazon.com

# Site
NEXT_PUBLIC_SITE_URL=https://www.raofindes.com
```

Generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

---

## Phase 4 — Custom Server for Phusion Passenger

Namecheap Passenger requires a `server.js` entry point. Create this in the project root:

```js
// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js"
  }
}
```

---

## Phase 5 — Build Locally & Upload

**Always build locally** — shared hosting may not have enough RAM to run `next build`.

```bash
# On your local machine
npm ci
npm run build

# Create a deployment archive (skip node_modules and source maps)
tar -czf deploy.tar.gz \
  .next \
  public \
  messages \
  server.js \
  package.json \
  package-lock.json \
  next.config.ts \
  tsconfig.json \
  postcss.config.mjs
```

### Upload steps

1. cPanel → **File Manager** → navigate to your app root directory
2. Upload `deploy.tar.gz`
3. Right-click → **Extract**
4. cPanel → **Setup Node.js App** → your app → click **Run NPM Install**
   - This installs only production dependencies on the server

### Set environment variables in cPanel

cPanel → **Setup Node.js App** → your app → **Environment Variables** section.
Add each variable from your `.env.local` one by one.

---

## Phase 6 — Node.js App Setup in cPanel

1. cPanel → **Setup Node.js App** → **Create Application**
2. Fill in:

| Field | Value |
|---|---|
| Node.js version | 20.x (pick latest available) |
| Application mode | Production |
| Application root | `public_html` |
| Application URL | `raofindes.com` |
| Application startup file | `server.js` |

3. Click **Create**
4. After uploading files → click **Restart**

---

## Phase 7 — Domain & SSL Configuration

### Point domain to your hosting

In Namecheap **Domain List** → **Manage** → **Advanced DNS**:

| Type | Host | Value |
|---|---|---|
| A Record | @ | Your cPanel server IP |
| A Record | www | Your cPanel server IP |

Find your server IP: shown on the right side panel inside cPanel.

DNS propagation takes up to 24 hours.

### Force HTTPS and www with `.htaccess`

Create or edit `public_html/.htaccess`:

```apache
RewriteEngine On

# Force www
RewriteCond %{HTTP_HOST} ^raofindes\.com$ [NC]
RewriteRule ^(.*)$ https://www.raofindes.com/$1 [R=301,L]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

### Enable Free SSL (Let's Encrypt)

cPanel → **SSL/TLS Status** → **Run AutoSSL**

This installs a free certificate for both `raofindes.com` and `www.raofindes.com`. Renews automatically every 90 days.

---

## Phase 8 — Verify Deployment

### Restart the app

cPanel → **Setup Node.js App** → your app → **Restart**

### Test checklist

```
[ ] https://www.raofindes.com  — homepage loads
[ ] https://www.raofindes.com/en  — English locale works
[ ] https://www.raofindes.com/bn-BD  — Bangla locale works
[ ] https://www.raofindes.com/sv  — Swedish locale works
[ ] https://www.raofindes.com/admin/login  — admin login form shows
[ ] Admin login with MySQL user credentials works
[ ] Products page fetches data from MySQL
[ ] Amazon affiliate links are correct
[ ] SSL padlock shows in browser
[ ] http:// redirects to https://
[ ] raofindes.com redirects to www.raofindes.com
[ ] Images load (no broken images from old Supabase URLs)
```

### Check logs

cPanel → **Setup Node.js App** → note the log file path → open in File Manager.

---

## Summary of All Changes Required

| Old (Supabase) | New (MySQL / Namecheap) |
|---|---|
| `@supabase/supabase-js` | `mysql2` connection pool |
| `@supabase/ssr` + `createServerClient` | Direct `pool.execute()` queries |
| Supabase Auth | NextAuth.js with JWT + bcrypt |
| Supabase Edge Functions | Next.js API routes under `/api/` |
| Supabase Storage | `public/uploads/` folder or Cloudinary |
| `supabase/migrations/*.sql` | phpMyAdmin SQL import |
| Supabase env vars | MySQL + NextAuth env vars |

---

## Shared Hosting Limitations to Know

- **No PM2** — Passenger manages the process; crashes trigger an automatic restart but with a cold-start delay.
- **RAM limit** — `next build` needs ~512 MB RAM. Always build locally and upload the `.next` folder.
- **Connection pool** — Keep `connectionLimit: 5` or lower; shared hosting MySQL has a concurrent connection cap.
- **No WebSockets** — Real-time features will not work on shared hosting.
- **No cron jobs via Node** — Use cPanel **Cron Jobs** to hit your API routes on a schedule instead.

**Upgrade path:** When traffic grows, Namecheap VPS ($5–10/month) gives you PM2, full Node.js control, and no Passenger limitations.