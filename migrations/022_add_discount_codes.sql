CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  percent_off INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  single_use BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_by_admin_id UUID REFERENCES admin_users(id),
  used_at TIMESTAMPTZ,
  used_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT discount_codes_percent_off_check CHECK (percent_off > 0 AND percent_off < 100),
  CONSTRAINT discount_codes_window_check CHECK (starts_at < ends_at)
);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS subtotal_amount BIGINT,
ADD COLUMN IF NOT EXISTS discount_amount BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id),
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE orders
SET subtotal_amount = COALESCE(subtotal_amount, amount),
    discount_amount = COALESCE(discount_amount, 0),
    discount_percent = COALESCE(discount_percent, 0),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE subtotal_amount IS NULL
   OR discount_amount IS NULL
   OR discount_percent IS NULL
   OR updated_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_active_discount_code_unique
ON orders(discount_code_id)
WHERE discount_code_id IS NOT NULL AND status IN ('pending', 'paid');

CREATE INDEX IF NOT EXISTS idx_discount_codes_active_window
ON discount_codes(active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_discount_codes_used_order_id
ON discount_codes(used_order_id);