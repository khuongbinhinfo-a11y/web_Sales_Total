CREATE TABLE IF NOT EXISTS app_license_runtime_leases (
  license_id UUID PRIMARY KEY REFERENCES app_licenses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  client_type TEXT NOT NULL CHECK (client_type IN ('desktop', 'web')),
  client_id TEXT NOT NULL,
  client_name TEXT,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_app_license_runtime_leases_customer_app
  ON app_license_runtime_leases(customer_id, app_id);

CREATE INDEX IF NOT EXISTS idx_app_license_runtime_leases_expires_at
  ON app_license_runtime_leases(expires_at);