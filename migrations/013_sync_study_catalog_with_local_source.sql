UPDATE apps
SET
  name = 'Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học',
  slug = 'phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc',
  status = 'active',
  description = 'Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc.'
WHERE id = 'app-study-12';

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('prod-test-2k', 'app-study-12', 'INTERNAL Sepay Test', 'one_time', 2000, 'VND', 1, FALSE),
  ('prod-study-month', 'app-study-12', 'Goi Thang Tieu Chuan', 'monthly', 89000, 'VND', 120, TRUE),
  ('prod-study-year', 'app-study-12', 'Goi Nam Tieu Chuan', 'yearly', 599000, 'VND', 1800, TRUE),
  ('prod-study-premium-month', 'app-study-12', 'Goi Thang Cao Cap', 'monthly', 119000, 'VND', 240, TRUE),
  ('prod-study-premium-year', 'app-study-12', 'Goi Nam Cao Cap', 'yearly', 899000, 'VND', 3600, TRUE),
  ('prod-study-standard-lifetime', 'app-study-12', 'Goi Tron Doi Tieu Chuan', 'one_time', 1299000, 'VND', 9990, TRUE),
  ('prod-study-premium-lifetime', 'app-study-12', 'Goi Tron Doi Cao Cap', 'one_time', 1599000, 'VND', 15990, TRUE),
  ('prod-study-topup', 'app-study-12', 'Top-up 300 Credit', 'one_time', 149000, 'VND', 300, TRUE)
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = EXCLUDED.active;