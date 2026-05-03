import { Router } from 'express';
import pool from '../db/connection.js';
import { newId } from '../utils/uuid.js';

const router = Router();

// GET /products  — list with optional filters
router.get('/', async (req, res) => {
  const {
    category_id, status, is_active, is_featured, search, locale = 'en',
    slug, min_price, max_price, brand, on_sale, sort,
    limit = 20, offset = 0,
  } = req.query;

  const where = [];
  const params = [];

  if (category_id) { where.push('p.category_id = ?'); params.push(category_id); }
  if (status)      { where.push('p.product_status = ?'); params.push(status); }
  if (is_active !== undefined) { where.push('p.is_active = ?'); params.push(is_active === 'true' ? 1 : 0); }
  if (is_featured !== undefined) { where.push('p.is_featured = ?'); params.push(is_featured === 'true' ? 1 : 0); }
  if (brand)       { where.push('p.brand = ?'); params.push(brand); }
  if (on_sale === 'true') { where.push('p.discount_pct > 0'); }
  if (min_price !== undefined) { where.push('p.price_cents >= ?'); params.push(Number(min_price)); }
  if (max_price !== undefined) { where.push('p.price_cents <= ?'); params.push(Number(max_price)); }

  if (slug) {
    where.push(`(JSON_UNQUOTE(JSON_EXTRACT(p.slug, '$.en')) = ? OR JSON_UNQUOTE(JSON_EXTRACT(p.slug, CONCAT('$."', ?, '"'))) = ?)`);
    params.push(slug, locale, slug);
  }

  if (search) {
    const col = locale === 'sv' ? 'search_name_sv' : locale === 'bn-BD' ? 'search_name_bn' : 'search_name_en';
    where.push(`MATCH(${col}) AGAINST(? IN BOOLEAN MODE)`);
    params.push(search + '*');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderClause = sort === 'price_asc' ? 'p.price_cents ASC'
    : sort === 'price_desc' ? 'p.price_cents DESC'
    : 'p.created_at DESC';

  const [rows] = await pool.query(
    `SELECT p.*, pi.url AS primary_image_url
     FROM products p
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
     ${whereClause}
     ORDER BY ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${whereClause}`, params
  );
  res.json({ data: rows, total, limit: Number(limit), offset: Number(offset) });
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*,
       JSON_ARRAYAGG(JSON_OBJECT('id', pi.id, 'url', pi.url, 'is_primary', pi.is_primary,
         'sort_order', pi.sort_order, 'width', pi.width, 'height', pi.height)) AS images
     FROM products p
     LEFT JOIN product_images pi ON pi.product_id = p.id
     WHERE p.id = ?
     GROUP BY p.id`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// GET /products/asin/:asin
router.get('/asin/:asin', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE asin = ?', [req.params.asin]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /products  (admin)
router.post('/', async (req, res) => {
  const {
    asin, category_id, name, slug, description, features, meta_title, meta_description,
    price_cents, original_price_cents, currency, discount_pct, rating, review_count,
    affiliate_url, brand, availability, is_featured, is_active, product_status,
    attributes, show_in_comparison, publish_at,
  } = req.body;

  if (!asin || !affiliate_url || !name || !slug) {
    return res.status(400).json({ error: 'asin, affiliate_url, name, slug are required' });
  }

  const id = newId();
  await pool.query(
    `INSERT INTO products
      (id, asin, category_id, name, slug, description, features, meta_title, meta_description,
       price_cents, original_price_cents, currency, discount_pct, rating, review_count,
       affiliate_url, brand, availability, is_featured, is_active, product_status,
       attributes, show_in_comparison, publish_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, asin, category_id ?? null,
      JSON.stringify(name), JSON.stringify(slug),
      JSON.stringify(description ?? {}), JSON.stringify(features ?? []),
      JSON.stringify(meta_title ?? {}), JSON.stringify(meta_description ?? {}),
      price_cents ?? null, original_price_cents ?? null,
      currency ?? 'USD', discount_pct ?? 0, rating ?? null, review_count ?? 0,
      affiliate_url, brand ?? null, availability ?? 'unknown',
      is_featured ? 1 : 0, is_active !== false ? 1 : 0,
      product_status ?? 'draft',
      JSON.stringify(attributes ?? {}), show_in_comparison ? 1 : 0,
      publish_at ?? null,
    ]
  );

  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

// PATCH /products/:id  (admin)
router.patch('/:id', async (req, res) => {
  const jsonFields = ['name','slug','description','features','meta_title','meta_description','attributes'];
  const fields = [];
  const values = [];
  const allowed = [
    'category_id','asin','price_cents','original_price_cents','currency','discount_pct',
    'rating','review_count','affiliate_url','brand','availability','is_featured','is_active',
    'product_status','rejection_reason','submitted_by','show_in_comparison','publish_at',
    ...jsonFields,
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(jsonFields.includes(key) ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
});

// DELETE /products/:id  (admin)
router.delete('/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// GET /products/:id/images
router.get('/:id/images', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [req.params.id]
  );
  res.json(rows);
});

// POST /products/:id/images
router.post('/:id/images', async (req, res) => {
  const { url, alt_text, width, height, sort_order, is_primary } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const id = newId();
  if (is_primary) {
    await pool.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = ?', [req.params.id]);
  }
  await pool.query(
    `INSERT INTO product_images (id, product_id, url, alt_text, width, height, sort_order, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.params.id, url, JSON.stringify(alt_text ?? {}), width ?? null, height ?? null, sort_order ?? 0, is_primary ? 1 : 0]
  );
  const [rows] = await pool.query('SELECT * FROM product_images WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
});

// GET /products/comparison/list
router.get('/comparison/list', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, pi.url AS primary_image_url
     FROM products p
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
     WHERE p.show_in_comparison = TRUE AND p.is_active = TRUE`
  );
  res.json(rows);
});

export default router;
