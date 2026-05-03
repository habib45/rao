import { Router } from 'express';
import pool from '../db/connection.js';
import { newId } from '../utils/uuid.js';

const router = Router();

// ── Admin Settings ───────────────────────────────────────────

router.get('/settings', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM admin_settings');
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
});

router.get('/settings/:key', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM admin_settings WHERE `key` = ?', [req.params.key]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.put('/settings/:key', async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value is required' });
  await pool.query(
    'INSERT INTO admin_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [req.params.key, JSON.stringify(value), JSON.stringify(value)]
  );
  const [rows] = await pool.query('SELECT * FROM admin_settings WHERE `key` = ?', [req.params.key]);
  res.json(rows[0]);
});

// ── Sync Logs ────────────────────────────────────────────────

router.get('/sync-logs', async (req, res) => {
  const { function_name, status, limit = 50 } = req.query;
  const where = [];
  const params = [];
  if (function_name) { where.push('function_name = ?'); params.push(function_name); }
  if (status)        { where.push('status = ?'); params.push(status); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM sync_logs ${whereClause} ORDER BY started_at DESC LIMIT ?`,
    [...params, Number(limit)]
  );
  res.json(rows);
});

router.post('/sync-logs', async (req, res) => {
  const { function_name, status, items_processed, errors, started_at, completed_at } = req.body;
  if (!function_name || !status) return res.status(400).json({ error: 'function_name and status required' });
  const id = newId();
  await pool.query(
    `INSERT INTO sync_logs (id, function_name, status, items_processed, errors, started_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, function_name, status, items_processed ?? 0, JSON.stringify(errors ?? []),
     started_at ?? null, completed_at ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM sync_logs WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

// ── Translations UI ──────────────────────────────────────────

router.get('/translations', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM translations_ui ORDER BY namespace, `key`');
  res.json(rows);
});

router.put('/translations/:namespace/:key', async (req, res) => {
  const { translations } = req.body;
  if (!translations) return res.status(400).json({ error: 'translations required' });
  const id = newId();
  await pool.query(
    `INSERT INTO translations_ui (id, namespace, \`key\`, translations) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE translations = ?`,
    [id, req.params.namespace, req.params.key, JSON.stringify(translations), JSON.stringify(translations)]
  );
  const [rows] = await pool.query(
    'SELECT * FROM translations_ui WHERE namespace = ? AND `key` = ?',
    [req.params.namespace, req.params.key]
  );
  res.json(rows[0]);
});

// ── Dashboard Stats ──────────────────────────────────────────

router.get('/dashboard', async (_req, res) => {
  const [[products]]     = await pool.query('SELECT COUNT(*) AS total FROM products WHERE is_active = TRUE');
  const [[categories]]   = await pool.query('SELECT COUNT(*) AS total FROM categories WHERE is_active = TRUE');
  const [[clicks_today]] = await pool.query(
    'SELECT COUNT(*) AS total FROM click_tracking WHERE DATE(clicked_at) = CURDATE()'
  );
  const [[subscribers]]  = await pool.query(
    'SELECT COUNT(*) AS total FROM newsletter_subscribers WHERE is_active = TRUE'
  );
  const [[blog_posts]]   = await pool.query(
    'SELECT COUNT(*) AS total FROM blog_posts WHERE status = "published"'
  );
  const [recent_clicks]  = await pool.query(
    `SELECT p.id, JSON_UNQUOTE(JSON_EXTRACT(p.name, '$.en')) AS name, COUNT(*) AS clicks
     FROM click_tracking ct JOIN products p ON p.id = ct.product_id
     WHERE ct.clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY p.id ORDER BY clicks DESC LIMIT 10`
  );

  res.json({
    products: products.total,
    categories: categories.total,
    clicks_today: clicks_today.total,
    subscribers: subscribers.total,
    blog_posts: blog_posts.total,
    top_products_7d: recent_clicks,
  });
});

// ── Price History ─────────────────────────────────────────────

router.get('/price-history/:product_id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM price_history WHERE product_id = ? ORDER BY recorded_at DESC LIMIT 100',
    [req.params.product_id]
  );
  res.json(rows);
});

router.post('/price-history', async (req, res) => {
  const { product_id, price_cents, currency } = req.body;
  if (!product_id || price_cents == null) return res.status(400).json({ error: 'product_id and price_cents required' });
  const id = newId();
  await pool.query(
    'INSERT INTO price_history (id, product_id, price_cents, currency) VALUES (?, ?, ?, ?)',
    [id, product_id, price_cents, currency ?? 'USD']
  );
  const [rows] = await pool.query('SELECT * FROM price_history WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

// ── Scheduled Publishing ──────────────────────────────────────

router.post('/publish-scheduled', async (_req, res) => {
  const [result] = await pool.query(
    `UPDATE products
     SET is_active = TRUE, publish_at = NULL
     WHERE publish_at IS NOT NULL AND publish_at <= NOW() AND is_active = FALSE`
  );
  res.json({ published: result.affectedRows });
});

// ── Sitemap Entries ───────────────────────────────────────────

router.get('/sitemap-entries', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM sitemap_custom_entries WHERE is_active = TRUE ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.post('/sitemap-entries', async (req, res) => {
  const { url, priority, changefreq, last_modified, notes } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const id = newId();
  await pool.query(
    `INSERT INTO sitemap_custom_entries (id, url, priority, changefreq, last_modified, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, url, priority ?? 0.5, changefreq ?? 'weekly', last_modified ?? null, notes ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM sitemap_custom_entries WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

router.delete('/sitemap-entries/:id', async (req, res) => {
  await pool.query('DELETE FROM sitemap_custom_entries WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ── Pending Review Count ──────────────────────────────────────

router.get('/pending-review-count', async (_req, res) => {
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products WHERE product_status = 'pending_review'`
  );
  res.json({ count: total });
});

// ── Scheduled Products ────────────────────────────────────────

router.get('/scheduled-products', async (req, res) => {
  const { limit = 10 } = req.query;
  const [rows] = await pool.query(
    `SELECT id, asin, name, publish_at FROM products
     WHERE publish_at IS NOT NULL AND is_active = FALSE
     ORDER BY publish_at ASC LIMIT ?`,
    [Number(limit)]
  );
  res.json(rows);
});

// ── Click Analytics ───────────────────────────────────────────

router.get('/analytics/clicks', async (req, res) => {
  const { from, to, locale, product_id, group_by, limit = 50, offset = 0 } = req.query;

  if (group_by === 'day') {
    const days = from ? Math.ceil((Date.now() - new Date(from).getTime()) / 86400000) : 30;
    const [rows] = await pool.query(
      `SELECT DATE(clicked_at) AS day, COUNT(*) AS click_count
       FROM click_tracking
       WHERE clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(clicked_at)
       ORDER BY day ASC`,
      [days]
    );
    return res.json({ grouped: rows, groupBy: 'day' });
  }

  if (group_by === 'locale') {
    const where = [];
    const params = [];
    if (from) { where.push('clicked_at >= ?'); params.push(from); }
    if (to)   { where.push('clicked_at <= ?'); params.push(to); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT locale, COUNT(*) AS clicks FROM click_tracking ${whereClause} GROUP BY locale ORDER BY clicks DESC`,
      params
    );
    return res.json({ grouped: rows, groupBy: 'locale' });
  }

  if (group_by === 'product') {
    const where = [];
    const params = [];
    if (from) { where.push('ct.clicked_at >= ?'); params.push(from); }
    if (to)   { where.push('ct.clicked_at <= ?'); params.push(to); }
    if (locale) { where.push('ct.locale = ?'); params.push(locale); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT ct.product_id, JSON_UNQUOTE(JSON_EXTRACT(p.name, '$.en')) AS name, p.asin, COUNT(*) AS clicks
       FROM click_tracking ct JOIN products p ON p.id = ct.product_id
       ${whereClause}
       GROUP BY ct.product_id ORDER BY clicks DESC LIMIT 50`,
      params
    );
    return res.json({ grouped: rows, groupBy: 'product' });
  }

  // Paginated list
  const where = [];
  const params = [];
  if (from) { where.push('ct.clicked_at >= ?'); params.push(from); }
  if (to)   { where.push('ct.clicked_at <= ?'); params.push(to); }
  if (locale) { where.push('ct.locale = ?'); params.push(locale); }
  if (product_id) { where.push('ct.product_id = ?'); params.push(product_id); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ct.*, JSON_UNQUOTE(JSON_EXTRACT(p.name, '$.en')) AS product_name, p.asin
     FROM click_tracking ct LEFT JOIN products p ON p.id = ct.product_id
     ${whereClause}
     ORDER BY ct.clicked_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM click_tracking ct ${whereClause}`, params
  );
  res.json({ clicks: rows, total });
});

export default router;
