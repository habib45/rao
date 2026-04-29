-- 00007_admin_dashboard_functions.sql
-- Postgres functions for the admin dashboard analytics.

-- Click trends aggregated by day
CREATE OR REPLACE FUNCTION admin_click_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE(day DATE, click_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT clicked_at::date AS day, COUNT(*) AS click_count
  FROM click_tracking
  WHERE clicked_at >= now() - (days_back || ' days')::interval
  GROUP BY day
  ORDER BY day;
$$;

-- Top categories by click count
CREATE OR REPLACE FUNCTION admin_top_categories(lim INTEGER DEFAULT 10)
RETURNS TABLE(category_id UUID, category_name JSONB, click_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT c.id, c.name, COUNT(ct.id) AS click_count
  FROM click_tracking ct
  JOIN products p ON ct.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  WHERE ct.clicked_at >= now() - interval '30 days'
  GROUP BY c.id, c.name
  ORDER BY click_count DESC
  LIMIT lim;
$$;

-- Dashboard stats summary
CREATE OR REPLACE FUNCTION admin_dashboard_stats()
RETURNS TABLE(
  total_products BIGINT,
  active_products BIGINT,
  total_categories BIGINT,
  active_categories BIGINT,
  clicks_7d BIGINT,
  clicks_30d BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM products) AS total_products,
    (SELECT COUNT(*) FROM products WHERE is_active = true) AS active_products,
    (SELECT COUNT(*) FROM categories) AS total_categories,
    (SELECT COUNT(*) FROM categories WHERE is_active = true) AS active_categories,
    (SELECT COUNT(*) FROM click_tracking WHERE clicked_at >= now() - interval '7 days') AS clicks_7d,
    (SELECT COUNT(*) FROM click_tracking WHERE clicked_at >= now() - interval '30 days') AS clicks_30d;
$$;
