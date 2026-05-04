-- Migration: rollout 7 CAP01 packages and hide legacy CAP01 sellable products
-- Created: 2026-05-04

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

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
  sale_status,
  sale_note,
  created_at
)
VALUES
  ('cap01_standard_1year_3grades', 'app-study-12', 'CAP01 - Standard 01 nam / 03 lop', 'yearly', 599000, 'VND', 1800, TRUE, 'public', 'live', '', NOW()),
  ('cap01_grade_la_1year', 'app-study-12', 'CAP01 - 01 nam / Lop La', 'yearly', 299000, 'VND', 900, TRUE, 'public', 'live', '', NOW()),
  ('cap01_grade_1_1year', 'app-study-12', 'CAP01 - 01 nam / Lop 01', 'yearly', 299000, 'VND', 900, TRUE, 'public', 'live', '', NOW()),
  ('cap01_grade_2_1year', 'app-study-12', 'CAP01 - 01 nam / Lop 02', 'yearly', 299000, 'VND', 900, TRUE, 'public', 'live', '', NOW()),
  ('cap01_grade_3_1year', 'app-study-12', 'CAP01 - 01 nam / Lop 03', 'yearly', 349000, 'VND', 900, TRUE, 'public', 'live', '', NOW()),
  ('cap01_grade_4_1year', 'app-study-12', 'CAP01 - 01 nam / Lop 04', 'yearly', 349000, 'VND', 900, TRUE, 'public', 'live', '', NOW()),
  ('cap01_grade_5_1year', 'app-study-12', 'CAP01 - 01 nam / Lop 05', 'yearly', 349000, 'VND', 900, TRUE, 'public', 'live', '', NOW())
ON CONFLICT (id) DO UPDATE
SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = TRUE,
  visibility = 'public',
  sale_status = 'live',
  sale_note = '';

UPDATE products
SET visibility = 'hidden',
    updated_at = NOW()
WHERE id IN (
  'prod-study-month',
  'prod-study-year',
  'prod-study-premium-month',
  'prod-study-premium-year',
  'prod-study-standard-lifetime',
  'prod-study-premium-lifetime',
  'standard_1year_1grade',
  'cap01_beta_year_299'
);
