-- Migration: update study standard lifetime price to 1,299,000 VND
-- Created: 2026-04-24

UPDATE products
SET price = 1299000,
    currency = 'VND',
    active = TRUE
WHERE id = 'prod-study-standard-lifetime';