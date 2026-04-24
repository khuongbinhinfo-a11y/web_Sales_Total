-- Migration: Đổi tên prod-video-lifetime → prod-bds-website-lifetime
-- Created: 2026-04-24
-- Purpose: Đổi sản phẩm "Video Creator" thành "Phần Mềm Quản Lý Website & Tin Đăng Bất Động Sản"

-- 1. Thêm sản phẩm mới với ID mới
INSERT INTO products (id, app_id, name, cycle, price, currency, credits, active, created_at)
VALUES (
  'prod-bds-website-lifetime',
  'app-prompt-image-video',
  'Phần Mềm Quản Lý Website & Tin Đăng Bất Động Sản',
  'lifetime',
  0,
  'VND',
  0,
  TRUE,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Cập nhật orders đang trỏ đến prod-video-lifetime (FK orders_product_id_fkey)
UPDATE orders
SET product_id = 'prod-bds-website-lifetime'
WHERE product_id = 'prod-video-lifetime';

-- 3. Cập nhật mọi license đang trỏ đến prod-video-lifetime (FK app_licenses_product_id_fkey)
UPDATE app_licenses
SET product_id = 'prod-bds-website-lifetime',
    plan_code  = 'prod-bds-website-lifetime',
    updated_at = NOW()
WHERE product_id = 'prod-video-lifetime';

-- 4. Xóa sản phẩm cũ (an toàn vì FK đã được chuyển ở bước 2 và 3)
DELETE FROM products WHERE id = 'prod-video-lifetime';

-- 5. Verify
SELECT id, app_id, name, cycle, active FROM products WHERE app_id = 'app-prompt-image-video';
