import { Router } from 'express';
import pool from '../db/connection.js';
import { newId } from '../utils/uuid.js';

const router = Router();

// ── Blog Categories ──────────────────────────────────────────

router.get('/categories', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM blog_categories WHERE is_active = TRUE ORDER BY sort_order ASC'
  );
  res.json(rows);
});

router.post('/categories', async (req, res) => {
  const { name, slug, description, color, sort_order, is_active } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  const id = newId();
  await pool.query(
    `INSERT INTO blog_categories (id, name, slug, description, color, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, JSON.stringify(name), JSON.stringify(slug), JSON.stringify(description ?? {}),
     color ?? null, sort_order ?? 0, is_active !== false ? 1 : 0]
  );
  const [rows] = await pool.query('SELECT * FROM blog_categories WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

router.patch('/categories/:id', async (req, res) => {
  const jsonFields = ['name', 'slug', 'description'];
  const allowed = ['name', 'slug', 'description', 'color', 'sort_order', 'is_active'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(jsonFields.includes(key) ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await pool.query(`UPDATE blog_categories SET ${fields.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM blog_categories WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/categories/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM blog_categories WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── Blog Posts ───────────────────────────────────────────────

router.get('/posts', async (req, res) => {
  const { status, is_featured, category_id, search, slug, sort, limit = 20, offset = 0 } = req.query;
  const where = [];
  const params = [];

  if (status)      { where.push('status = ?'); params.push(status); }
  if (is_featured !== undefined) { where.push('is_featured = ?'); params.push(is_featured === 'true' ? 1 : 0); }
  if (category_id) { where.push('blog_category_id = ?'); params.push(category_id); }
  if (search)      { where.push('MATCH(content) AGAINST(? IN BOOLEAN MODE)'); params.push(search + '*'); }
  if (slug) {
    where.push(`(JSON_UNQUOTE(JSON_EXTRACT(slug, '$.en')) = ? OR JSON_UNQUOTE(JSON_EXTRACT(slug, '$."bn-BD"')) = ? OR JSON_UNQUOTE(JSON_EXTRACT(slug, '$.sv')) = ?)`);
    params.push(slug, slug, slug);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderClause = sort === 'views' ? 'view_count DESC' : 'published_at DESC';
  const [rows] = await pool.query(
    `SELECT * FROM blog_posts ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM blog_posts ${whereClause}`, params
  );
  res.json({ data: rows, total, limit: Number(limit), offset: Number(offset) });
});

router.get('/posts/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });

  const [tags] = await pool.query(
    `SELECT bt.* FROM blog_tags bt
     JOIN blog_post_tags bpt ON bpt.blog_tag_id = bt.id
     WHERE bpt.blog_post_id = ?`,
    [req.params.id]
  );
  res.json({ ...rows[0], tags });
});

router.post('/posts', async (req, res) => {
  const {
    blog_category_id, title, slug, excerpt, content, cover_image_url, cover_image_alt,
    meta_title, meta_description, author_name, author_avatar_url, status,
    is_featured, read_time_minutes, published_at, tags = [],
  } = req.body;
  if (!title || !slug || !content) return res.status(400).json({ error: 'title, slug, content required' });

  const id = newId();
  await pool.query(
    `INSERT INTO blog_posts
      (id, blog_category_id, title, slug, excerpt, content, cover_image_url, cover_image_alt,
       meta_title, meta_description, author_name, author_avatar_url, status,
       is_featured, read_time_minutes, published_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, blog_category_id ?? null,
      JSON.stringify(title), JSON.stringify(slug), JSON.stringify(excerpt ?? {}),
      content, cover_image_url ?? null, JSON.stringify(cover_image_alt ?? {}),
      JSON.stringify(meta_title ?? {}), JSON.stringify(meta_description ?? {}),
      author_name ?? 'BestFinds', author_avatar_url ?? null,
      status ?? 'draft', is_featured ? 1 : 0, read_time_minutes ?? 0,
      published_at ?? null,
    ]
  );

  if (tags.length) {
    const tagValues = tags.map(tid => [id, tid]);
    await pool.query('INSERT IGNORE INTO blog_post_tags (blog_post_id, blog_tag_id) VALUES ?', [tagValues]);
  }

  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

router.patch('/posts/:id', async (req, res) => {
  const jsonFields = ['title','slug','excerpt','cover_image_alt','meta_title','meta_description'];
  const allowed = [
    'blog_category_id','status','is_featured','read_time_minutes','published_at',
    'author_name','author_avatar_url','cover_image_url','content', ...jsonFields,
  ];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(jsonFields.includes(key) ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await pool.query(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/posts/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── Blog Comments ────────────────────────────────────────────

router.get('/posts/:id/comments', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM blog_comments WHERE blog_post_id = ? AND is_approved = TRUE ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json(rows);
});

router.post('/posts/:id/comments', async (req, res) => {
  const { author_name, author_email, body, parent_id } = req.body;
  if (!author_name || !author_email || !body)
    return res.status(400).json({ error: 'author_name, author_email, body required' });
  const id = newId();
  await pool.query(
    'INSERT INTO blog_comments (id, blog_post_id, author_name, author_email, body, parent_id) VALUES (?,?,?,?,?,?)',
    [id, req.params.id, author_name, author_email, body, parent_id ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM blog_comments WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

// ── Blog Comments Admin ──────────────────────────────────────

router.get('/comments', async (req, res) => {
  const { post_id, status, limit = 20, offset = 0 } = req.query;
  const where = [];
  const params = [];
  if (post_id) { where.push('bc.blog_post_id = ?'); params.push(post_id); }
  if (status === 'approved') { where.push('bc.is_approved = TRUE'); }
  else if (status === 'pending') { where.push('bc.is_approved = FALSE'); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT bc.*, JSON_UNQUOTE(JSON_EXTRACT(bp.title, '$.en')) AS post_title
     FROM blog_comments bc
     LEFT JOIN blog_posts bp ON bp.id = bc.blog_post_id
     ${whereClause}
     ORDER BY bc.created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM blog_comments bc ${whereClause}`, params
  );
  res.json({ data: rows, total });
});

router.patch('/comments/:id', async (req, res) => {
  const { is_approved } = req.body;
  if (is_approved === undefined) return res.status(400).json({ error: 'is_approved required' });
  await pool.query('UPDATE blog_comments SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, req.params.id]);
  const [rows] = await pool.query('SELECT * FROM blog_comments WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

router.delete('/comments/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM blog_comments WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── Blog Tags ────────────────────────────────────────────────

router.get('/tags', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM blog_tags ORDER BY id');
  res.json(rows);
});

router.post('/tags', async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
  const id = newId();
  await pool.query('INSERT INTO blog_tags (id, name, slug) VALUES (?, ?, ?)',
    [id, JSON.stringify(name), JSON.stringify(slug)]);
  const [rows] = await pool.query('SELECT * FROM blog_tags WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

export default router;
