UPDATE products
SET name = 'Goi Thang Tieu Chuan', price = 89000, credits = 120, active = TRUE
WHERE id = 'prod-study-month';

UPDATE products
SET name = 'Goi Nam Tieu Chuan', price = 599000, credits = 1800, active = TRUE
WHERE id = 'prod-study-year';

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('prod-study-premium-month', 'app-study-12', 'Goi Thang Cao Cap', 'monthly', 119000, 'VND', 240, TRUE),
  ('prod-study-premium-year', 'app-study-12', 'Goi Nam Cao Cap', 'yearly', 899000, 'VND', 3600, TRUE)
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = EXCLUDED.active;

INSERT INTO product_keys(id, product_id, key_value, status)
VALUES
  (gen_random_uuid(), 'prod-study-premium-month', 'WST-PRE-MONTH-0001', 'available'),
  (gen_random_uuid(), 'prod-study-premium-month', 'WST-PRE-MONTH-0002', 'available'),
  (gen_random_uuid(), 'prod-study-premium-year', 'WST-PRE-YEAR-0001', 'available'),
  (gen_random_uuid(), 'prod-study-premium-year', 'WST-PRE-YEAR-0002', 'available')
ON CONFLICT (key_value) DO NOTHING;
