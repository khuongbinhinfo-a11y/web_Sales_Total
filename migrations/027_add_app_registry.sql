CREATE TABLE IF NOT EXISTS app_registry (
  app_id TEXT PRIMARY KEY REFERENCES apps(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  business_group TEXT NOT NULL DEFAULT 'general',
  delivery_type TEXT NOT NULL DEFAULT 'manual_delivery',
  web_url TEXT NOT NULL DEFAULT '',
  pricing_url TEXT NOT NULL DEFAULT '',
  download_url TEXT NOT NULL DEFAULT '',
  manifest_url TEXT NOT NULL DEFAULT '',
  release_notes_url TEXT NOT NULL DEFAULT '',
  update_channel TEXT NOT NULL DEFAULT 'stable',
  owner_name TEXT NOT NULL DEFAULT '',
  support_url TEXT NOT NULL DEFAULT '',
  support_sla_hours INTEGER NOT NULL DEFAULT 24,
  public_ready BOOLEAN NOT NULL DEFAULT FALSE,
  checklist_note TEXT NOT NULL DEFAULT '',
  health_status TEXT NOT NULL DEFAULT 'unknown',
  health_score INTEGER NOT NULL DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_registry_public_ready
  ON app_registry(public_ready);

CREATE INDEX IF NOT EXISTS idx_app_registry_health_status
  ON app_registry(health_status);

CREATE TABLE IF NOT EXISTS app_registry_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  check_code TEXT NOT NULL,
  severity TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  message TEXT NOT NULL,
  detail_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  health_score INTEGER NOT NULL DEFAULT 0,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_registry_checks_app_time
  ON app_registry_checks(app_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_registry_checks_batch
  ON app_registry_checks(check_batch_id);

CREATE TABLE IF NOT EXISTS app_registry_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  actor_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_username TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  before_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_registry_audit_logs_app_time
  ON app_registry_audit_logs(app_id, created_at DESC);