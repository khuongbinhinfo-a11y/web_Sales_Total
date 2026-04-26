-- Migration: add product sale status for admin card lock / coming soon
-- Created: 2026-04-26

ALTER TABLE products
ADD COLUMN IF NOT EXISTS sale_status TEXT NOT NULL DEFAULT 'live';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS sale_note TEXT NOT NULL DEFAULT '';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_sale_status_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_sale_status_check
    CHECK (sale_status IN ('live', 'locked', 'coming_soon'));
  END IF;
END $$;

UPDATE products
SET sale_status = 'live'
WHERE sale_status IS NULL OR TRIM(sale_status) = '';

UPDATE products
SET sale_note = ''
WHERE sale_note IS NULL;