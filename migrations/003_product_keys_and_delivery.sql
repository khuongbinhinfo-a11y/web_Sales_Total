CREATE TABLE IF NOT EXISTS product_keys (
  id UUID PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  key_value TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available',
  reserved_order_id UUID REFERENCES orders(id),
  delivered_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_key_deliveries (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  key_id UUID NOT NULL UNIQUE REFERENCES product_keys(id),
  delivered_to_customer TEXT NOT NULL REFERENCES customers(id),
  delivery_channel TEXT NOT NULL,
  delivered_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_keys_product_status ON product_keys(product_id, status);
CREATE INDEX IF NOT EXISTS idx_order_key_deliveries_customer ON order_key_deliveries(delivered_to_customer);
