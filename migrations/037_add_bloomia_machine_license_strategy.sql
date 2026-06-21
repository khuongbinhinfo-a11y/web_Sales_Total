-- Migration 037: Add Bloomia machine-locked licensing strategy
-- Backward compatible defaults keep existing products on legacy_hybrid.

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS license_strategy TEXT NOT NULL DEFAULT 'legacy_hybrid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_license_strategy'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT chk_product_license_strategy
      CHECK (license_strategy IN ('legacy_hybrid', 'inventory_key', 'generated_machine'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ALTER TABLE app_licenses
  ADD COLUMN IF NOT EXISTS activation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS machine_id TEXT,
  ADD COLUMN IF NOT EXISTS machine_name TEXT,
  ADD COLUMN IF NOT EXISTS reset_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reset_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_reset_by_admin UUID REFERENCES admin_users(id);

CREATE INDEX IF NOT EXISTS idx_app_licenses_machine_id
  ON app_licenses(machine_id)
  WHERE machine_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_licenses_activation_token_hash
  ON app_licenses(activation_token_hash)
  WHERE activation_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_licenses_reset_count
  ON app_licenses(reset_count);

INSERT INTO apps(id, name, slug, status, description)
VALUES (
  'app-bloomia-pos',
  'Bloomia Studio POS',
  'bloomia-studio-pos',
  'active',
  'Phan mem ban hang va cap license rieng cho Bloomia Studio POS.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

INSERT INTO products(
  id, app_id, name, cycle, price, currency, credits, active, fulfillment_mode, license_strategy
)
VALUES
  (
    'prod-bloomia-yearly',
    'app-bloomia-pos',
    'Bloomia Studio POS - Goi Nam',
    'yearly',
    0,
    'VND',
    0,
    FALSE,
    'auto_license',
    'generated_machine'
  ),
  (
    'prod-bloomia-lifetime',
    'app-bloomia-pos',
    'Bloomia Studio POS - Vinh vien',
    'one_time',
    0,
    'VND',
    0,
    FALSE,
    'auto_license',
    'generated_machine'
  )
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  name = EXCLUDED.name,
  cycle = EXCLUDED.cycle,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  credits = EXCLUDED.credits,
  active = EXCLUDED.active,
  fulfillment_mode = EXCLUDED.fulfillment_mode,
  license_strategy = EXCLUDED.license_strategy;

INSERT INTO app_registry(
  app_id, display_name, business_group, delivery_type, web_url, pricing_url,
  download_url, manifest_url, release_notes_url, update_channel, owner_name,
  support_url, support_sla_hours, public_ready, checklist_note, health_status, health_score
)
VALUES (
  'app-bloomia-pos',
  'Bloomia Studio POS',
  'software',
  'manual_delivery',
  '',
  '',
  '',
  '',
  '',
  'stable',
  '',
  '',
  24,
  FALSE,
  'Bloomia app dang trong nhom san pham moi, hien chua mo ban tu dong.',
  'unknown',
  0
)
ON CONFLICT (app_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  business_group = EXCLUDED.business_group,
  delivery_type = EXCLUDED.delivery_type,
  update_channel = EXCLUDED.update_channel,
  checklist_note = EXCLUDED.checklist_note,
  updated_at = NOW();

COMMIT;
