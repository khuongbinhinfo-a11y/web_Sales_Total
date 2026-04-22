-- ============================================================================
-- PRODUCTION SYNC: Migrations 013 + 015 (Safe Upsert)
-- ============================================================================
-- Purpose: Sync 100% production database with local canonical version
-- Includes: Study catalog (8 products) + Google Map product (demo-map)
-- Safety: All statements use ON CONFLICT DO UPDATE (idempotent, safe to re-run)
-- Date: 2026-04-22
--
-- EXECUTION INSTRUCTIONS:
-- 1. Go to Google Cloud Console > Cloud SQL > Open query editor
-- 2. Copy-paste entire script below
-- 3. Execute (should complete in <2 seconds)
-- 4. Verify: SELECT COUNT(*) FROM products WHERE app_id IN ('app-study-12', 'lamviec');
--    Expected: 10 products (8 study + 1 demo-map)
-- ============================================================================

-- MIGRATION 013: Sync Study Catalog With Local Source
UPDATE apps
SET
  name = 'Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học',
  slug = 'phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc',
  status = 'active',
  description = 'Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc.'
WHERE id = 'app-study-12';

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('prod-test-2k', 'app-study-12', 'INTERNAL Sepay Test', 'one_time', 2000, 'VND', 1, FALSE),
  ('prod-study-month', 'app-study-12', 'Goi Thang Tieu Chuan', 'monthly', 89000, 'VND', 120, TRUE),
  ('prod-study-year', 'app-study-12', 'Goi Nam Tieu Chuan', 'yearly', 599000, 'VND', 1800, TRUE),
  ('prod-study-premium-month', 'app-study-12', 'Goi Thang Cao Cap', 'monthly', 119000, 'VND', 240, TRUE),
  ('prod-study-premium-year', 'app-study-12', 'Goi Nam Cao Cap', 'yearly', 899000, 'VND', 3600, TRUE),
  ('prod-study-standard-lifetime', 'app-study-12', 'Goi Tron Doi Tieu Chuan', 'one_time', 999000, 'VND', 9990, TRUE),
  ('prod-study-premium-lifetime', 'app-study-12', 'Goi Tron Doi Cao Cap', 'one_time', 1599000, 'VND', 15990, TRUE),
  ('prod-study-topup', 'app-study-12', 'Top-up 300 Credit', 'one_time', 149000, 'VND', 300, TRUE)
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = EXCLUDED.active;

-- MIGRATION 015: Add Google Map Customer Data Product
INSERT INTO apps(id, name, slug, status, description)
VALUES
  ('lamviec', 'Phần mềm làm việc', 'phan-mem-lam-viec', 'active', 'Bo cong cu phan mem phuc vu cong viec va tu dong hoa quy trinh.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('demo-map', 'lamviec', 'Phần Mềm Quét Data Khách Hàng Trên Google Map', 'one_time', 499000, 'VND', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = EXCLUDED.active;

INSERT INTO product_keys(id, product_id, key_value, status)
VALUES
  (gen_random_uuid(), 'demo-map', 'WST-MAP-0001', 'available'),
  (gen_random_uuid(), 'demo-map', 'WST-MAP-0002', 'available')
ON CONFLICT (key_value) DO NOTHING;

-- VERIFICATION QUERY (run after execution):
-- SELECT id, app_id, name, price FROM products WHERE app_id IN ('app-study-12', 'lamviec') ORDER BY app_id, name;
