-- Migration 036: Create order_fulfillments table for manual vendor/service fulfillment
-- Purpose: Track orders that require manual fulfillment after payment
-- Only used for products with fulfillment_mode = 'manual_vendor' or 'manual_service'

BEGIN;

CREATE TABLE IF NOT EXISTS order_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  fulfillment_mode TEXT NOT NULL CHECK (fulfillment_mode IN ('manual_vendor', 'manual_service')),
  status TEXT NOT NULL DEFAULT 'waiting_manual_fulfillment'
    CHECK (status IN ('waiting_manual_fulfillment', 'ready_to_deliver', 'delivered', 'cancelled')),
  delivery_data JSONB DEFAULT '{}',
  admin_note TEXT,
  customer_note TEXT,
  sent_at TIMESTAMPTZ,
  sent_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT order_fulfillments_order_product_unique UNIQUE (order_id, product_id)
);

-- Index for listing fulfillments by status
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_status ON order_fulfillments(status);

-- Index for listing fulfillments by order
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_order_id ON order_fulfillments(order_id);

-- Index for admin lookup by product
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_product_id ON order_fulfillments(product_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_order_fulfillments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_fulfillments_updated_at ON order_fulfillments;
CREATE TRIGGER trg_order_fulfillments_updated_at
  BEFORE UPDATE ON order_fulfillments
  FOR EACH ROW EXECUTE FUNCTION update_order_fulfillments_updated_at();

COMMIT;