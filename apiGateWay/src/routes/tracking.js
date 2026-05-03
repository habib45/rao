import { Router } from 'express';
import pool from '../db/connection.js';
import { newId } from '../utils/uuid.js';

const router = Router();

// POST /tracking/click
router.post('/click', async (req, res) => {
  const { product_id, locale, session_id, referrer, user_agent, ip_hash } = req.body;
  if (!product_id || !session_id) return res.status(400).json({ error: 'product_id and session_id required' });
  const validLocales = ['en', 'bn-BD', 'sv'];
  if (!validLocales.includes(locale)) return res.status(400).json({ error: 'Invalid locale' });

  const id = newId();
  await pool.query(
    `INSERT INTO click_tracking (id, product_id, locale, session_id, referrer, user_agent, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, product_id, locale, session_id, referrer ?? '', user_agent ?? '', ip_hash ?? null]
  );
  res.status(201).json({ success: true });
});

// GET /tracking/clicks/:product_id  (admin)
router.get('/clicks/:product_id', async (req, res) => {
  const { from, to, limit = 100 } = req.query;
  const where = ['product_id = ?'];
  const params = [req.params.product_id];
  if (from) { where.push('clicked_at >= ?'); params.push(from); }
  if (to)   { where.push('clicked_at <= ?'); params.push(to); }
  const [rows] = await pool.query(
    `SELECT * FROM click_tracking WHERE ${where.join(' AND ')} ORDER BY clicked_at DESC LIMIT ?`,
    [...params, Number(limit)]
  );
  res.json(rows);
});

// GET /tracking/summary  (admin) — clicks per product
router.get('/summary', async (req, res) => {
  const { from, to } = req.query;
  const where = [];
  const params = [];
  if (from) { where.push('clicked_at >= ?'); params.push(from); }
  if (to)   { where.push('clicked_at <= ?'); params.push(to); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT product_id, locale, COUNT(*) AS clicks
     FROM click_tracking ${whereClause}
     GROUP BY product_id, locale
     ORDER BY clicks DESC`,
    params
  );
  res.json(rows);
});

export default router;
