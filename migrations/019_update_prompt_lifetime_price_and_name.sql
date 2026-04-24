-- Migration: Update prod-prompt-lifetime content identity and price
-- Created: 2026-04-24

UPDATE products
SET name = 'Video Creator - Phần mềm tạo prompt và điều phối AI Video trong một nơi',
    price = 249000,
    currency = 'VND',
    active = TRUE
WHERE id = 'prod-prompt-lifetime';
