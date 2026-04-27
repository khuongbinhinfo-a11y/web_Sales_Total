-- Migration 020: Add map-pro app and machine-lock columns for product_keys
-- App: Phần Mềm Quét Data Khách Hàng Trên Google Map (GG Map Pro)
-- Product: demo-map  →  app_id changed from 'lamviec' to 'map-pro'
-- License model: 1 key / 1 machine ID / lifetime / 12-month free updates

-- 1. Create app record
INSERT INTO apps(id, name, slug, status, description)
VALUES (
  'map-pro',
  'Phần Mềm Quét Data Khách Hàng Trên Google Map',
  'phan-mem-quet-data-google-map',
  'active',
  'Tool quét dữ liệu doanh nghiệp, địa điểm từ Google Map, xuất Excel tự động.'
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  slug        = EXCLUDED.slug,
  status      = EXCLUDED.status,
  description = EXCLUDED.description;

-- 2. Re-parent demo-map product from 'lamviec' → 'map-pro'
UPDATE products
SET app_id = 'map-pro'
WHERE id = 'demo-map';

-- 3. Add machine-lock columns to product_keys (no-op if already present)
ALTER TABLE product_keys
  ADD COLUMN IF NOT EXISTS machine_id          TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS machine_display_id  TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS machine_locked_at   TIMESTAMPTZ  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS machine_last_seen_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_product_keys_machine_id ON product_keys(machine_id)
  WHERE machine_id IS NOT NULL;

-- 4. Verification
-- SELECT id, app_id, name, price FROM products WHERE id = 'demo-map';
-- SELECT column_name FROM information_schema.columns WHERE table_name='product_keys' AND column_name LIKE 'machine%';
