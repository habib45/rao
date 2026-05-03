import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pool from './db/connection.js';
import { requireApiKey } from './middleware/auth.js';

import categoriesRouter from './routes/categories.js';
import productsRouter   from './routes/products.js';
import blogRouter       from './routes/blog.js';
import newsletterRouter from './routes/newsletter.js';
import trackingRouter   from './routes/tracking.js';
import adminRouter      from './routes/admin.js';
import authRouter       from './routes/auth.js';

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ── Health check (public) ─────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Auth routes (public) ─────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Public routes ─────────────────────────────────────────────
app.use('/api/categories',  categoriesRouter);
app.use('/api/products',    productsRouter);
app.use('/api/blog',        blogRouter);
app.use('/api/newsletter',  newsletterRouter);
app.use('/api/tracking',    trackingRouter);

// ── Admin routes (API key required) ──────────────────────────
app.use('/api/admin', requireApiKey, adminRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ORH API Gateway running on http://localhost:${PORT}`);
  console.log(`  Health:    GET  /health`);
  console.log(`  Products:  GET  /api/products`);
  console.log(`  Blog:      GET  /api/blog/posts`);
  console.log(`  Admin:     *    /api/admin  (x-api-key required)`);
});
