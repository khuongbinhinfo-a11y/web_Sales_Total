-- Migration 031: Add web-demo app catalog and sellable products (templates + addons)

INSERT INTO apps(id, name, slug, status, description)
VALUES (
  'app-web-demo-services',
  'Mau Web Co Admin Don Gian',
  'mau-web-co-admin-don-gian',
  'active',
  'Danh muc goi trien khai web mau va addon domain/hosting cho luong ban hang /mau-demo.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
VALUES
  ('prod-web-demo-company-basic',      'app-web-demo-services', 'Web Mau Cong Ty - Goi Co Ban',                   'one_time',  3900000, 'VND', 0, TRUE),
  ('prod-web-demo-company-pro',        'app-web-demo-services', 'Web Mau Cong Ty - Goi Chuyen Nghiep',            'one_time',  6900000, 'VND', 0, TRUE),
  ('prod-web-demo-company-brand',      'app-web-demo-services', 'Web Mau Cong Ty - Goi Thuong Hieu',              'one_time', 12900000, 'VND', 0, TRUE),

  ('prod-web-demo-shop-showcase',      'app-web-demo-services', 'Web Mau Shop - Goi Gioi Thieu',                  'one_time',  4900000, 'VND', 0, TRUE),
  ('prod-web-demo-shop-sales',         'app-web-demo-services', 'Web Mau Shop - Goi Ban Hang',                    'one_time',  8900000, 'VND', 0, TRUE),
  ('prod-web-demo-shop-advanced',      'app-web-demo-services', 'Web Mau Shop - Goi Nang Cao',                    'one_time', 16900000, 'VND', 0, TRUE),

  ('prod-web-demo-salon-mini',         'app-web-demo-services', 'Web Mau Salon - Goi Mini',                       'one_time',  3900000, 'VND', 0, TRUE),
  ('prod-web-demo-salon-pro',          'app-web-demo-services', 'Web Mau Salon - Goi Chuyen Nghiep',              'one_time',  6900000, 'VND', 0, TRUE),
  ('prod-web-demo-salon-booking',      'app-web-demo-services', 'Web Mau Salon - Goi Ban Hang Dat Lich',          'one_time', 12900000, 'VND', 0, TRUE),

  ('prod-web-demo-industry-basic',     'app-web-demo-services', 'Web Mau Cong Nghiep - Goi Co Ban',               'one_time',  3900000, 'VND', 0, TRUE),
  ('prod-web-demo-industry-pro',       'app-web-demo-services', 'Web Mau Cong Nghiep - Goi Chuyen Nghiep',        'one_time',  6900000, 'VND', 0, TRUE),
  ('prod-web-demo-industry-booking',   'app-web-demo-services', 'Web Mau Cong Nghiep - Goi Dat Ban Dat Mon',      'one_time', 13900000, 'VND', 0, TRUE),

  ('prod-web-demo-landing-basic',      'app-web-demo-services', 'Web Mau Landing - Goi Tuyen Sinh Co Ban',        'one_time',  4900000, 'VND', 0, TRUE),
  ('prod-web-demo-landing-pro',        'app-web-demo-services', 'Web Mau Landing - Goi Trung Tam Dao Tao',        'one_time',  8900000, 'VND', 0, TRUE),
  ('prod-web-demo-landing-system',     'app-web-demo-services', 'Web Mau Landing - Goi He Thong Khoa Hoc',        'one_time', 18900000, 'VND', 0, TRUE),

  ('prod-web-demo-addon-domain',       'app-web-demo-services', 'Addon Ten Mien (.com/.vn tuy loai)',             'one_time',   850000, 'VND', 0, TRUE),
  ('prod-web-demo-addon-hosting',      'app-web-demo-services', 'Addon Hosting Nam Dau',                           'one_time',  2400000, 'VND', 0, TRUE)
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = EXCLUDED.active;
