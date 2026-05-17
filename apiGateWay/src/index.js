import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requireAuth, requireRole, requireApiKey, requireApiKeyOrJwt } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import blogRouter from './routes/blog.js';
import newsletterRouter from './routes/newsletter.js';
import trackingRouter from './routes/tracking.js';
import tokensRouter from './routes/tokens.js';
import pool from './db/connection.js';

const app  = express();
const PORT = process.env.PORT || 4000;

// Trust proxy for proper header handling behind reverse proxy
app.set('trust proxy', true);

// CORS: Only HTTPS in production, allow HTTP for local development
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://raofinds.com',
      'https://www.raofinds.com',
    ]
  : [
      'https://raofinds.com',
      'https://www.raofinds.com',
      'http://raofinds.com',
      'http://www.raofinds.com',
      'http://localhost:3000',
      'http://localhost:4000',
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Serve static files for admin UI
app.use(express.static('public'));

// ── Health check (public) ─────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Database debug endpoint ───────────────────────────────────
app.get('/debug/db', async (_req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      hasPassword: !!process.env.DB_PASSWORD,
    },
    connection: null,
    error: null,
  };

  try {
    // Test basic connection
    const connection = await pool.getConnection();
    debugInfo.connection = {
      status: 'connected',
      threadId: connection.threadId,
      serverVersion: connection.serverVersion,
    };
    
    // Test query
    const [rows] = await connection.query('SELECT VERSION() as version, NOW() as server_time, DATABASE() as current_db');
    debugInfo.connection.serverInfo = rows[0];
    
    // Test table access
    const [tables] = await connection.query('SHOW TABLES');
    debugInfo.connection.tableCount = tables.length;
    debugInfo.connection.tables = tables.map(t => Object.values(t)[0]);
    
    connection.release();
    
    res.json(debugInfo);
  } catch (error) {
    debugInfo.error = {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    };
    res.status(500).json(debugInfo);
  }
});

app.get('/', (req, res) => {
  res.redirect('/admin/login.html');
});

// ── Auth routes (public) ─────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Public routes (no authentication required for public API) ──────
app.use('/api/categories',  categoriesRouter);
app.use('/api/products',    productsRouter);
app.use('/api/blog',        blogRouter);
app.use('/api/newsletter',  newsletterRouter);
app.use('/api/tracking',    trackingRouter);

// ── Token management routes (auth required) ──────────────────
app.use('/api/tokens', requireAuth, tokensRouter);

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
