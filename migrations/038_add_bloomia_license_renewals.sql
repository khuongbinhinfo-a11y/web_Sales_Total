-- Migration 038: Track Bloomia license renewals
-- Keeps the same license key and machine binding while recording order-to-license renewal history.

BEGIN;

CREATE TABLE IF NOT EXISTS app_license_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES app_licenses(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  previous_order_id UUID,
  new_order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  previous_expires_at TIMESTAMPTZ,
  new_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_license_renewals_license_created
  ON app_license_renewals(license_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_license_renewals_customer_app_created
  ON app_license_renewals(customer_id, app_id, created_at DESC);

COMMIT;
