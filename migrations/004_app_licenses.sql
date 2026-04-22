CREATE TABLE IF NOT EXISTS app_licenses (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  plan_code TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  device_id TEXT,
  device_name TEXT,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_licenses_customer_app ON app_licenses(customer_id, app_id);
CREATE INDEX IF NOT EXISTS idx_app_licenses_status ON app_licenses(status);
CREATE INDEX IF NOT EXISTS idx_app_licenses_license_key ON app_licenses(license_key);
