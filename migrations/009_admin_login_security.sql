CREATE TABLE IF NOT EXISTS admin_login_guards (
  dimension TEXT NOT NULL,
  subject TEXT NOT NULL,
  fail_count INT NOT NULL DEFAULT 0,
  first_failed_at TIMESTAMPTZ,
  lock_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_login_guards_pk PRIMARY KEY (dimension, subject),
  CONSTRAINT admin_login_guards_dimension_check CHECK (dimension IN ('ip', 'username', 'pair'))
);

CREATE INDEX IF NOT EXISTS idx_admin_login_guards_lock_until
  ON admin_login_guards(lock_until);

CREATE TABLE IF NOT EXISTS admin_login_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  username TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  login_method TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason TEXT,
  admin_user_id UUID REFERENCES admin_users(id),
  role TEXT,
  requires_otp BOOLEAN NOT NULL DEFAULT FALSE,
  otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT admin_login_audits_method_check CHECK (login_method IN ('password', 'owner_key')),
  CONSTRAINT admin_login_audits_outcome_check CHECK (outcome IN ('success', 'failure', 'blocked', 'challenge'))
);

CREATE INDEX IF NOT EXISTS idx_admin_login_audits_attempted_at
  ON admin_login_audits(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_login_audits_username
  ON admin_login_audits(username);

CREATE INDEX IF NOT EXISTS idx_admin_login_audits_ip
  ON admin_login_audits(ip_address);
