INSERT INTO apps (id, name, slug, status, description)
VALUES (
  'hair-spa-manager',
  'Salon Manager',
  'salon-manager',
  'active',
  'Phần mềm quản lý salon tóc theo mô hình 1 key / 1 máy.'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    status = EXCLUDED.status,
    description = EXCLUDED.description;

INSERT INTO products (id, app_id, name, cycle, price, currency, credits, active)
VALUES (
  'prod-salon-manager-lifetime',
  'hair-spa-manager',
  'Salon Manager',
  'one_time',
  990000,
  'VND',
  0,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET app_id = EXCLUDED.app_id,
    name = EXCLUDED.name,
    cycle = EXCLUDED.cycle,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    credits = EXCLUDED.credits,
    active = EXCLUDED.active;