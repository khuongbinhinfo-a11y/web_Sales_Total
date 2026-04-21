ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_code TEXT;

UPDATE orders
SET order_code = CONCAT('ODR-', UPPER(REPLACE(SUBSTRING(id::text, 1, 8), '-', '')))
WHERE order_code IS NULL;

ALTER TABLE orders
ALTER COLUMN order_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code_unique
ON orders(order_code);
