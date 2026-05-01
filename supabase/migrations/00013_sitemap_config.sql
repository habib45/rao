-- Custom URL entries for sitemap management
CREATE TABLE sitemap_custom_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url           text NOT NULL UNIQUE,
  priority      numeric(2,1) NOT NULL DEFAULT 0.5
                CHECK (priority >= 0.1 AND priority <= 1.0),
  changefreq    text NOT NULL DEFAULT 'weekly'
                CHECK (changefreq IN ('always','hourly','daily','weekly','monthly','yearly','never')),
  last_modified timestamptz,
  is_active     boolean NOT NULL DEFAULT true,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sitemap_custom_entries_active
  ON sitemap_custom_entries(is_active);

CREATE TRIGGER sitemap_custom_entries_updated_at
  BEFORE UPDATE ON sitemap_custom_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sitemap_custom_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on sitemap_custom_entries"
  ON sitemap_custom_entries
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Seed admin_settings with sitemap/robots defaults
INSERT INTO admin_settings (key, value) VALUES
  ('sitemap_exclusions', '{"slugs": []}'),
  ('sitemap_cache_ttl',  '{"seconds": 3600}'),
  ('robots_config', '{"rules": [{"userAgent": "*", "allow": ["/"], "disallow": ["/api/", "/_next/", "/admin/"]}]}')
ON CONFLICT (key) DO NOTHING;
