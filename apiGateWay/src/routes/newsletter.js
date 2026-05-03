import { Router } from 'express';
import pool from '../db/connection.js';
import { newId } from '../utils/uuid.js';

const router = Router();

// POST /newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  const { email, name, locale, ip_hash } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const [existing] = await pool.query(
    'SELECT id, is_active FROM newsletter_subscribers WHERE email = ?', [email]
  );

  if (existing.length) {
    if (existing[0].is_active) return res.status(409).json({ error: 'Already subscribed' });
    await pool.query(
      'UPDATE newsletter_subscribers SET is_active = TRUE, unsubscribed_at = NULL WHERE email = ?',
      [email]
    );
    return res.json({ success: true, resubscribed: true });
  }

  const id = newId();
  await pool.query(
    'INSERT INTO newsletter_subscribers (id, email, name, locale, ip_hash) VALUES (?, ?, ?, ?, ?)',
    [id, email, name ?? null, locale ?? 'en', ip_hash ?? null]
  );
  res.status(201).json({ success: true });
});

// POST /newsletter/unsubscribe
router.post('/unsubscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  await pool.query(
    'UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = NOW() WHERE email = ?',
    [email]
  );
  res.json({ success: true });
});

// GET /newsletter/subscribers  (admin)
router.get('/subscribers', async (req, res) => {
  const { is_active, limit = 50, offset = 0 } = req.query;
  const where = is_active !== undefined
    ? `WHERE is_active = ${is_active === 'true' ? 1 : 0}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM newsletter_subscribers ${where} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM newsletter_subscribers ${where}`
  );
  res.json({ data: rows, total });
});

export default router;
