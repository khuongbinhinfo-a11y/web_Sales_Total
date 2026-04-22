INSERT INTO apps(id, name, slug, status, description)
VALUES
  ('lamviec', 'Phần mềm làm việc', 'phan-mem-lam-viec', 'active', 'Bo cong cu phan mem phuc vu cong viec va tu dong hoa quy trinh.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('demo-map', 'lamviec', 'Phần Mềm Quét Data Khách Hàng Trên Google Map', 'one_time', 499000, 'VND', 3, TRUE)
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
  (gen_random_uuid(), 'demo-map', 'WST-MAP-0001', 'available'),
  (gen_random_uuid(), 'demo-map', 'WST-MAP-0002', 'available')
ON CONFLICT (key_value) DO NOTHING;
