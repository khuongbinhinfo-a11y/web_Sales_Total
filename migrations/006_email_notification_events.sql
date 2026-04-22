CREATE TABLE IF NOT EXISTS email_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'gmail',
  recipient TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  reason TEXT,
  provider_message_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notification_events_order_type_created
  ON email_notification_events(order_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_notification_events_status_created
  ON email_notification_events(status, created_at DESC);
