ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_token TEXT,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_customers_telegram_link_token ON customers(telegram_link_token);
