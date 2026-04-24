-- Migration: support hidden products + add silent-launch yearly plan for app-study-12
-- Created: 2026-04-24

ALTER TABLE products
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_visibility_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_visibility_check
    CHECK (visibility IN ('public', 'hidden'));
  END IF;
END $$;

INSERT INTO products (
  id,
  app_id,
  name,
  cycle,
  price,
  currency,
  credits,
  active,
  visibility,
  created_at
)
VALUES (
  'standard_1year_1grade',
  'app-study-12',
  'Gói 01 Năm - 01 Lớp Full môn học',
  'yearly',
  299000,
  'VND',
  1800,
  TRUE,
  'hidden',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET app_id = EXCLUDED.app_id,
    name = EXCLUDED.name,
    cycle = EXCLUDED.cycle,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    credits = EXCLUDED.credits,
    active = EXCLUDED.active,
    visibility = EXCLUDED.visibility;
