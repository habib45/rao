import { Router } from 'express';
import pool from '../db/connection.js';
import { newId } from '../utils/uuid.js';

const router = Router();

// GET /categories
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC'
  );
  res.json(rows);
});

// GET /categories/:id
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /categories  (admin)
router.post('/', async (req, res) => {
  const { name, slug, description, amazon_node_id, parent_id, sort_order, image_url, is_active } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  const id = newId();
  await pool.query(
    `INSERT INTO categories (id, amazon_node_id, name, slug, description, parent_id, sort_order, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, amazon_node_id ?? null, JSON.stringify(name), JSON.stringify(slug),
     JSON.stringify(description ?? {}), parent_id ?? null, sort_order ?? 0, image_url ?? null, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

// PATCH /categories/:id  (admin)
router.patch('/:id', async (req, res) => {
  const fields = [];
  const values = [];
  const allowed = ['amazon_node_id','name','slug','description','parent_id','sort_order','image_url','is_active'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// DELETE /categories/:id  (admin)
router.delete('/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
