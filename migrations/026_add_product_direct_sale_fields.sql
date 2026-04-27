ALTER TABLE products
ADD COLUMN IF NOT EXISTS compare_price BIGINT,
ADD COLUMN IF NOT EXISTS sale_price BIGINT,
ADD COLUMN IF NOT EXISTS sale_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_coupon_stack BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE products
SET compare_price = price
WHERE compare_price IS NULL;

UPDATE products
SET sale_enabled = FALSE
WHERE sale_enabled IS NULL;

UPDATE products
SET allow_coupon_stack = TRUE
WHERE allow_coupon_stack IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_compare_price_non_negative_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_compare_price_non_negative_check
    CHECK (compare_price IS NULL OR compare_price >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_sale_price_non_negative_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_sale_price_non_negative_check
    CHECK (sale_price IS NULL OR sale_price >= 0);
  END IF;
END $$;