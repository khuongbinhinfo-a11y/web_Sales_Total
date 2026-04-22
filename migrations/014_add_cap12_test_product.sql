INSERT INTO apps(id, name, slug, status, description)
VALUES (
  'app-cap12',
  'Phần mềm học tập khối cấp 12',
  'phan-mem-hoc-tap-khoi-cap-12',
  'active',
  'San pham hoc tap khoi cap 12 gia test de kiem tra card va thanh toan.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES (
  'demo-hoc12',
  'app-cap12',
  'Phần mềm học tập khối cấp 12',
  'one_time',
  2000,
  'VND',
  1,
  TRUE
)
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
  (gen_random_uuid(), 'demo-hoc12', 'WST-HOC12-TEST-0001', 'available'),
  (gen_random_uuid(), 'demo-hoc12', 'WST-HOC12-TEST-0002', 'available')
ON CONFLICT (key_value) DO NOTHING;