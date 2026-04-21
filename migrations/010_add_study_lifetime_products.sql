INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('prod-study-standard-lifetime', 'app-study-12', 'Goi Tron Doi Tieu Chuan', 'one_time', 999000, 'VND', 9990, TRUE),
  ('prod-study-premium-lifetime', 'app-study-12', 'Goi Tron Doi Cao Cap', 'one_time', 1599000, 'VND', 15990, TRUE)
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
  (gen_random_uuid(), 'prod-study-standard-lifetime', 'WST-LIFE-STD-0001', 'available'),
  (gen_random_uuid(), 'prod-study-standard-lifetime', 'WST-LIFE-STD-0002', 'available'),
  (gen_random_uuid(), 'prod-study-premium-lifetime', 'WST-LIFE-PRM-0001', 'available'),
  (gen_random_uuid(), 'prod-study-premium-lifetime', 'WST-LIFE-PRM-0002', 'available')
ON CONFLICT (key_value) DO NOTHING;
