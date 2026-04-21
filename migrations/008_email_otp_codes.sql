CREATE TABLE IF NOT EXISTS customer_email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_email_otps_lookup
  ON customer_email_otps(email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_email_otps_expiry
  ON customer_email_otps(expires_at);
