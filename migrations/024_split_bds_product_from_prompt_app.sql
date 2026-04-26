-- Migration: Tách sản phẩm BĐS khỏi app-prompt-image-video
-- Created: 2026-04-26
-- Purpose: app-prompt-image-video chỉ giữ Video Creator 249k; sản phẩm BĐS chuyển sang app riêng để không bị gom chung theo app_id

INSERT INTO apps (id, name, slug, status, description, created_at)
VALUES (
  'app-bds-website-manager',
  'BDS Website Manager',
  'bds-website-manager',
  'active',
  'Phần mềm quản lý website và tin đăng bất động sản',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

UPDATE products
SET app_id = 'app-bds-website-manager'
WHERE id = 'prod-bds-website-lifetime';

UPDATE orders
SET app_id = 'app-bds-website-manager'
WHERE product_id = 'prod-bds-website-lifetime';

UPDATE app_licenses
SET app_id = 'app-bds-website-manager',
    updated_at = NOW()
WHERE product_id = 'prod-bds-website-lifetime';

UPDATE app_license_runtime_leases
SET app_id = 'app-bds-website-manager'
WHERE license_id IN (
  SELECT id
  FROM app_licenses
  WHERE product_id = 'prod-bds-website-lifetime'
);

SELECT id, app_id, name, price, active
FROM products
WHERE id IN ('prod-prompt-lifetime', 'prod-bds-website-lifetime')
ORDER BY id;