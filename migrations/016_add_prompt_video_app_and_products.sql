-- Migration: Thêm app Prompt Video/Image và products lifetime
-- Created: 2026-04-24
-- Purpose: Setup app-prompt-image-video cho desktop app tạo video/ảnh

-- 1. Tạo app app-prompt-image-video
INSERT INTO apps (id, name, slug, status, description, created_at, updated_at)
VALUES (
  'app-prompt-image-video',
  'Prompt Video/Image Assistant',
  'prompt-video-image',
  'active',
  'Desktop app tạo video và ảnh từ prompt text',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Tạo 2 product lifetime cho app
INSERT INTO products (id, app_id, name, cycle, price, currency, credits, active, created_at, updated_at)
VALUES 
  (
    'prod-video-lifetime',
    'app-prompt-image-video',
    'Video Creator - Trọn đời',
    'lifetime',
    0,
    'VND',
    0,
    TRUE,
    NOW(),
    NOW()
  ),
  (
    'prod-prompt-lifetime',
    'app-prompt-image-video',
    'Image Prompt Generator - Trọn đời',
    'lifetime',
    0,
    'VND',
    0,
    TRUE,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Verify: kiểm tra app đã tạo
SELECT 
  a.id as appId,
  a.name as appName,
  a.status,
  COUNT(p.id) as totalProducts,
  SUM(CASE WHEN p.active = TRUE THEN 1 ELSE 0 END) as activeProducts
FROM apps a
LEFT JOIN products p ON a.id = p.app_id
WHERE a.id = 'app-prompt-image-video'
GROUP BY a.id, a.name, a.status;

-- 4. Verify: kiểm tra products vừa tạo
SELECT 
  p.id as productId,
  p.app_id as appId,
  p.name,
  p.cycle,
  p.active,
  p.created_at
FROM products p
WHERE p.app_id = 'app-prompt-image-video'
ORDER BY p.created_at DESC;
