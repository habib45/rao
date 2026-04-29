-- =============================================================
-- 004_create_procedures.sql
-- MySQL 8.0+ equivalent of Supabase migrations:
--   00007_admin_dashboard_functions.sql  (3 admin functions)
--   00008_product_scheduling.sql         (publish_scheduled_products)
--
-- KEY DIFFERENCES vs PostgreSQL:
--
-- 1. SECURITY DEFINER:
--    PostgreSQL SECURITY DEFINER runs under the definer's role regardless
--    of the caller. MySQL's SQL SECURITY DEFINER binds to the creating
--    user's grants — it does not integrate with JWT service roles.
--    These procedures use SQL SECURITY INVOKER so they run under the
--    caller's session grants. Application middleware (Next.js API routes)
--    must enforce access control before calling them.
--
-- 2. RETURNS TABLE → implicit result set:
--    PostgreSQL functions can RETURN TABLE(...). MySQL stored procedures
--    return result sets via SELECT statements; the caller reads them like
--    a normal query result.
--
-- 3. Interval arithmetic:
--    PostgreSQL:  now() - (days_back || ' days')::interval
--    MySQL:       NOW() - INTERVAL days_back DAY
--
-- 4. ::date cast:
--    PostgreSQL:  clicked_at::date
--    MySQL:       DATE(clicked_at)
--
-- 5. GET DIAGNOSTICS → ROW_COUNT():
--    PostgreSQL: GET DIAGNOSTICS updated_count = ROW_COUNT
--    MySQL:      SET updated_count = ROW_COUNT()  (call immediately after UPDATE)
--
-- 6. publish_scheduled_products scheduling:
--    The original was invoked by a Supabase Edge Function cron.
--    In MySQL, schedule via MySQL Event Scheduler or a Next.js cron route:
--
--      SET GLOBAL event_scheduler = ON;
--      CREATE EVENT ev_publish_scheduled
--        ON SCHEDULE EVERY 1 HOUR
--        DO CALL publish_scheduled_products(@n);
-- =============================================================

DELIMITER ;;

-- ---------------------------------------------------------------
-- admin_click_trends(days_back)
-- Returns one row per day with click count for the last N days.
-- Call: CALL admin_click_trends(30);
-- ---------------------------------------------------------------
CREATE PROCEDURE admin_click_trends(IN days_back INT)
  SQL SECURITY INVOKER
  COMMENT 'Click counts by day for last N days. Originally SECURITY DEFINER in PostgreSQL.'
BEGIN
  IF days_back IS NULL THEN
    SET days_back = 30;
  END IF;

  SELECT
    DATE(clicked_at) AS day,
    COUNT(*)         AS click_count
  FROM click_tracking
  WHERE clicked_at >= NOW() - INTERVAL days_back DAY
  GROUP BY DATE(clicked_at)
  ORDER BY day;
END;;


-- ---------------------------------------------------------------
-- admin_top_categories(lim)
-- Returns top N categories by click count over the last 30 days.
-- Call: CALL admin_top_categories(10);
-- category_name is the full JSON value; extract locale in the app:
--   JSON_UNQUOTE(JSON_EXTRACT(category_name, '$.en'))
-- ---------------------------------------------------------------
CREATE PROCEDURE admin_top_categories(IN lim INT)
  SQL SECURITY INVOKER
  COMMENT 'Top N categories by 30-day click volume. Originally SECURITY DEFINER in PostgreSQL.'
BEGIN
  IF lim IS NULL THEN
    SET lim = 10;
  END IF;

  SELECT
    c.id         AS category_id,
    c.name       AS category_name,
    COUNT(ct.id) AS click_count
  FROM click_tracking ct
  JOIN products   p ON ct.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  WHERE ct.clicked_at >= NOW() - INTERVAL 30 DAY
  GROUP BY c.id, c.name
  ORDER BY click_count DESC
  LIMIT lim;
END;;


-- ---------------------------------------------------------------
-- admin_dashboard_stats()
-- Returns a single summary row of platform-wide KPI counts.
-- Call: CALL admin_dashboard_stats();
-- ---------------------------------------------------------------
CREATE PROCEDURE admin_dashboard_stats()
  SQL SECURITY INVOKER
  COMMENT 'Platform KPI summary for the admin dashboard. Originally SECURITY DEFINER in PostgreSQL.'
BEGIN
  SELECT
    (SELECT COUNT(*) FROM products)                                                    AS total_products,
    (SELECT COUNT(*) FROM products   WHERE is_active = 1)                              AS active_products,
    (SELECT COUNT(*) FROM categories)                                                  AS total_categories,
    (SELECT COUNT(*) FROM categories WHERE is_active = 1)                              AS active_categories,
    (SELECT COUNT(*) FROM click_tracking WHERE clicked_at >= NOW() - INTERVAL 7  DAY) AS clicks_7d,
    (SELECT COUNT(*) FROM click_tracking WHERE clicked_at >= NOW() - INTERVAL 30 DAY) AS clicks_30d;
END;;


-- ---------------------------------------------------------------
-- publish_scheduled_products(OUT updated_count)
-- Activates draft products whose publish_at <= NOW().
-- Returns updated row count both as an OUT parameter and a result set.
--
-- Usage:
--   CALL publish_scheduled_products(@n);
--   SELECT @n;  -- rows published
--
--   -- Or read the result set directly (OUT param can be NULL):
--   CALL publish_scheduled_products(NULL);
-- ---------------------------------------------------------------
CREATE PROCEDURE publish_scheduled_products(OUT updated_count INT)
  SQL SECURITY INVOKER
  COMMENT 'Publishes due draft products. Replaces SECURITY DEFINER PostgreSQL function.'
BEGIN
  UPDATE products
  SET
    is_active  = 1,
    publish_at = NULL,
    updated_at = NOW()
  WHERE publish_at IS NOT NULL
    AND publish_at <= NOW()
    AND is_active = 0;

  SET updated_count = ROW_COUNT();

  SELECT updated_count AS rows_published;
END;;

DELIMITER ;
