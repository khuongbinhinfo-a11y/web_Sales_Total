CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id),
  name TEXT NOT NULL,
  cycle TEXT NOT NULL,
  price BIGINT NOT NULL,
  currency TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  provider_transaction_id TEXT NOT NULL UNIQUE,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  event_id TEXT PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  provider_transaction_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  status TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  renewal_mode TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, app_id)
);

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  feature_flags JSONB NOT NULL,
  valid_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, app_id)
);

CREATE TABLE IF NOT EXISTS credit_wallets (
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  balance BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, app_id)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  app_id TEXT NOT NULL REFERENCES apps(id),
  change_amount BIGINT NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON credit_ledger(customer_id);
