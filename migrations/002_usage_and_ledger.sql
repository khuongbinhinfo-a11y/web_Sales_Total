CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY,
  request_id TEXT UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  feature_key TEXT NOT NULL,
  units INTEGER NOT NULL,
  credits_consumed BIGINT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE credit_ledger
ADD COLUMN IF NOT EXISTS usage_log_id UUID REFERENCES ai_usage_logs(id);

CREATE INDEX IF NOT EXISTS idx_usage_customer ON ai_usage_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_app ON ai_usage_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON ai_usage_logs(feature_key);
