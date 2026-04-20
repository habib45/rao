-- 00005_seed_data.sql
-- Phase 2: Seed data for development and testing.
-- Idempotent: uses ON CONFLICT DO NOTHING or fixed UUIDs.

-- Categories (4: 3 active + 1 inactive; 1 child category)
INSERT INTO categories (id, amazon_node_id, name, slug, description, parent_id, sort_order, image_url, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '16225007011',
   '{"en": "Electronics", "bn-BD": "ইলেকট্রনিক্স", "sv": "Elektronik"}',
   '{"en": "electronics", "bn-BD": "electronics", "sv": "elektronik"}',
   '{"en": "Gadgets, devices, and accessories", "bn-BD": "গ্যাজেট, ডিভাইস এবং আনুষাঙ্গিক", "sv": "Prylar, enheter och tillbehor"}',
   NULL, 1, 'https://m.media-amazon.com/images/I/cat-electronics.jpg', true),

  ('a0000000-0000-0000-0000-000000000002', '1055398',
   '{"en": "Home & Kitchen", "bn-BD": "বাড়ি ও রান্নাঘর", "sv": "Hem och kok"}',
   '{"en": "home-kitchen", "bn-BD": "home-kitchen", "sv": "hem-kok"}',
   '{"en": "Home essentials and kitchen tools", "bn-BD": "গৃহস্থালি এবং রান্নাঘরের সরঞ্জাম", "sv": "Hemtillbehor och koksredskap"}',
   NULL, 2, 'https://m.media-amazon.com/images/I/cat-home.jpg', true),

  ('a0000000-0000-0000-0000-000000000003', '172282',
   '{"en": "Books", "bn-BD": "বই", "sv": "Bocker"}',
   '{"en": "books", "bn-BD": "books", "sv": "bocker"}',
   '{"en": "Fiction, non-fiction, and more", "bn-BD": "কথাসাহিত্য, নন-ফিকশন এবং আরও অনেক কিছু", "sv": "Skonlitteratur, facklitteratur och mer"}',
   NULL, 3, NULL, true),

  ('a0000000-0000-0000-0000-000000000004', NULL,
   '{"en": "Smartphones"}',
   '{"en": "smartphones"}',
   '{"en": "Mobile phones and accessories"}',
   'a0000000-0000-0000-0000-000000000001', 1, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Products (6: mix of featured, inactive, null price, all availability states)
INSERT INTO products (id, asin, category_id, name, slug, description, features, meta_title, meta_description, price_cents, original_price_cents, currency, discount_pct, rating, review_count, affiliate_url, brand, availability, is_featured, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'B0DTEST001',
   'a0000000-0000-0000-0000-000000000001',
   '{"en": "Wireless Bluetooth Headphones", "bn-BD": "ওয়্যারলেস ব্লুটুথ হেডফোন", "sv": "Tradlosa Bluetooth-horlurar"}',
   '{"en": "wireless-bluetooth-headphones", "bn-BD": "wireless-bluetooth-headphones", "sv": "tradlosa-bluetooth-horlurar"}',
   '{"en": "Premium noise-cancelling wireless headphones with 30h battery life", "bn-BD": "৩০ ঘণ্টা ব্যাটারি লাইফ সহ প্রিমিয়াম নয়েজ-ক্যান্সেলিং হেডফোন", "sv": "Premium tradlosa horlurar med brusreducering och 30 timmars batteri"}',
   '["Noise cancelling", "30h battery", "Bluetooth 5.3"]',
   '{"en": "Wireless Bluetooth Headphones | BestFinds", "bn-BD": "ওয়্যারলেস ব্লুটুথ হেডফোন | BestFinds", "sv": "Tradlosa Bluetooth-horlurar | BestFinds"}',
   '{"en": "Buy premium wireless headphones at the best price", "bn-BD": "সেরা দামে প্রিমিয়াম ওয়্যারলেস হেডফোন কিনুন", "sv": "Kop premium tradlosa horlurar till basta pris"}',
   4999, 7999, 'USD', 38, 4.5, 1250,
   'https://www.amazon.com/dp/B0DTEST001?tag=bestfinds-20', 'SoundMax',
   'in_stock', true, true),

  ('b0000000-0000-0000-0000-000000000002', 'B0DTEST002',
   'a0000000-0000-0000-0000-000000000001',
   '{"en": "USB-C Fast Charger 65W", "bn-BD": "USB-C ফাস্ট চার্জার ৬৫W"}',
   '{"en": "usb-c-fast-charger-65w", "bn-BD": "usb-c-fast-charger-65w"}',
   '{"en": "GaN 65W USB-C charger with dual ports", "bn-BD": "ডুয়াল পোর্ট সহ GaN 65W USB-C চার্জার"}',
   '["65W output", "Dual USB-C", "GaN technology"]',
   '{"en": "USB-C Fast Charger 65W | BestFinds"}',
   '{"en": "Compact 65W GaN charger for laptops and phones"}',
   2499, 3499, 'USD', 29, 4.3, 890,
   'https://www.amazon.com/dp/B0DTEST002?tag=bestfinds-20', 'ChargeTech',
   'in_stock', false, true),

  ('b0000000-0000-0000-0000-000000000003', 'B0DTEST003',
   'a0000000-0000-0000-0000-000000000002',
   '{"en": "Stainless Steel Water Bottle", "sv": "Vattenflaska i rostfritt stal"}',
   '{"en": "stainless-steel-water-bottle", "sv": "vattenflaska-rostfritt-stal"}',
   '{"en": "Double-wall insulated 750ml water bottle", "sv": "Dubbelvaggig isolerad vattenflaska 750ml"}',
   '["750ml capacity", "Double-wall insulation", "BPA free"]',
   '{"en": "Stainless Steel Water Bottle | BestFinds"}',
   '{"en": "Insulated stainless steel water bottle for hot and cold drinks"}',
   1899, 2499, 'USD', 24, 4.7, 3420,
   'https://www.amazon.com/dp/B0DTEST003?tag=bestfinds-20', 'HydroKeep',
   'in_stock', true, true),

  ('b0000000-0000-0000-0000-000000000004', 'B0DTEST004',
   'a0000000-0000-0000-0000-000000000003',
   '{"en": "The Art of Programming"}',
   '{"en": "the-art-of-programming"}',
   '{"en": "A comprehensive guide to clean code and software design"}',
   '["500+ pages", "Practical examples", "Updated 2024 edition"]',
   '{"en": "The Art of Programming | BestFinds"}',
   '{"en": "Learn clean code and software design patterns"}',
   NULL, NULL, 'USD', 0, 4.9, 150,
   'https://www.amazon.com/dp/B0DTEST004?tag=bestfinds-20', NULL,
   'out_of_stock', false, true),

  ('b0000000-0000-0000-0000-000000000005', 'B0DTEST005',
   'a0000000-0000-0000-0000-000000000001',
   '{"en": "Smart LED Desk Lamp"}',
   '{"en": "smart-led-desk-lamp"}',
   '{"en": "Adjustable color temperature LED desk lamp with USB charging port"}',
   '["Adjustable color temp", "USB charging port", "Touch control"]',
   '{"en": "Smart LED Desk Lamp | BestFinds"}',
   '{"en": "Smart desk lamp with adjustable color temperature"}',
   3299, 3999, 'USD', 18, 4.1, 670,
   'https://www.amazon.com/dp/B0DTEST005?tag=bestfinds-20', 'LumiDesk',
   'unknown', false, true),

  ('b0000000-0000-0000-0000-000000000006', 'B0DTEST006',
   'a0000000-0000-0000-0000-000000000002',
   '{"en": "Discontinued Kitchen Scale"}',
   '{"en": "discontinued-kitchen-scale"}',
   '{"en": "This product has been discontinued"}',
   '[]',
   '{"en": "Kitchen Scale | BestFinds"}',
   '{"en": "Digital kitchen scale"}',
   1599, 1599, 'USD', 0, 3.2, 45,
   'https://www.amazon.com/dp/B0DTEST006?tag=bestfinds-20', 'WeighIt',
   'in_stock', false, false)
ON CONFLICT (id) DO NOTHING;

-- Product Images (8: multiple per product, one primary each)
INSERT INTO product_images (id, product_id, url, alt_text, width, height, sort_order, is_primary)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'https://m.media-amazon.com/images/I/headphones-main.jpg',
   '{"en": "Wireless Bluetooth Headphones - Front View", "bn-BD": "ওয়্যারলেস ব্লুটুথ হেডফোন - সামনের দৃশ্য"}',
   1500, 1500, 0, true),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'https://m.media-amazon.com/images/I/headphones-side.jpg',
   '{"en": "Wireless Bluetooth Headphones - Side View"}',
   1500, 1500, 1, false),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'https://m.media-amazon.com/images/I/charger-main.jpg',
   '{"en": "USB-C Fast Charger 65W"}',
   1000, 1000, 0, true),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003',
   'https://m.media-amazon.com/images/I/bottle-main.jpg',
   '{"en": "Stainless Steel Water Bottle", "sv": "Vattenflaska i rostfritt stal"}',
   1200, 1200, 0, true),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
   'https://m.media-amazon.com/images/I/bottle-open.jpg',
   '{"en": "Water Bottle - Open Lid"}',
   1200, 1200, 1, false),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004',
   'https://m.media-amazon.com/images/I/book-cover.jpg',
   '{"en": "The Art of Programming - Book Cover"}',
   800, 1200, 0, true),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005',
   'https://m.media-amazon.com/images/I/desk-lamp-main.jpg',
   '{"en": "Smart LED Desk Lamp"}',
   1000, 1000, 0, true),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000006',
   'https://m.media-amazon.com/images/I/kitchen-scale.jpg',
   '{"en": "Digital Kitchen Scale"}',
   1000, 1000, 0, true)
ON CONFLICT (id) DO NOTHING;

-- Click Tracking (3: different locales)
INSERT INTO click_tracking (id, product_id, locale, session_id, referrer, user_agent, ip_hash, clicked_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'en', 'sess-001', 'https://www.google.com', 'Mozilla/5.0', 'abc123hash', '2025-01-15 10:30:00+00'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'bn-BD', 'sess-002', '', 'Mozilla/5.0', 'def456hash', '2025-01-15 11:00:00+00'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',
   'sv', 'sess-003', 'https://www.bing.com', 'Chrome/120', 'ghi789hash', '2025-01-15 12:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Cart Items (2: different sessions)
INSERT INTO cart_items (id, session_id, product_id, quantity)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'sess-001', 'b0000000-0000-0000-0000-000000000001', 1),
  ('e0000000-0000-0000-0000-000000000002', 'sess-002', 'b0000000-0000-0000-0000-000000000003', 2)
ON CONFLICT (id) DO NOTHING;

-- Price History (4: multiple entries for same product to show trends)
INSERT INTO price_history (id, product_id, price_cents, currency, recorded_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 7999, 'USD', '2025-01-01 00:00:00+00'),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 5999, 'USD', '2025-01-08 00:00:00+00'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 4999, 'USD', '2025-01-15 00:00:00+00'),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 1899, 'USD', '2025-01-15 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Translations UI (3: sample UI strings)
INSERT INTO translations_ui (id, namespace, key, translations)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'common', 'add_to_cart',
   '{"en": "Add to Cart", "bn-BD": "কার্টে যোগ করুন", "sv": "Lagg i kundvagn"}'),
  ('00000000-0000-0000-0000-000000000002', 'common', 'buy_now',
   '{"en": "Buy Now", "bn-BD": "এখনই কিনুন", "sv": "Kop nu"}'),
  ('00000000-0000-0000-0000-000000000003', 'product', 'out_of_stock',
   '{"en": "Out of Stock", "bn-BD": "স্টকে নেই", "sv": "Slut i lager"}')
ON CONFLICT (id) DO NOTHING;
