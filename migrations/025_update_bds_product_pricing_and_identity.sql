-- Migration: Chuẩn hóa nhận diện và giá bán cho app BĐS
-- Created: 2026-04-26
-- Purpose: chốt tên thương mại, giá 349k trọn đời và mô hình 1 key / 1 ID máy cho app BĐS

INSERT INTO apps (id, name, slug, status, description)
VALUES (
  'app-bds-website-manager',
  'Phần Mềm Quản Lý Website & Tin Đăng Bất Động Sản',
  'bds-website-manager',
  'active',
  'Phần mềm desktop quản lý website và tin đăng bất động sản theo mô hình 1 key / 1 ID máy.'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    status = EXCLUDED.status,
    description = EXCLUDED.description;

UPDATE products
SET app_id = 'app-bds-website-manager',
    name = 'Phần Mềm Quản Lý Website & Tin Đăng Bất Động Sản',
    cycle = 'one_time',
    price = 349000,
    currency = 'VND',
    credits = 0,
    active = TRUE
WHERE id = 'prod-bds-website-lifetime';

SELECT id, app_id, name, cycle, price, currency, active
FROM products
WHERE id = 'prod-bds-website-lifetime';