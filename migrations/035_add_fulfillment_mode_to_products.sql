-- Migration 035: Add fulfillment mode and vendor fields to products
-- Purpose: Classify how each product is fulfilled after payment
--   - auto_license: auto-deliver key after payment (existing behavior)
--   - manual_vendor: paid order, wait for admin to ship via vendor
--   - manual_service: paid order, wait for admin to process service
--   - quote_only: no online payment, show price for consultation
-- All existing products default to 'auto_license' (backward compatible)

BEGIN;

-- Add fulfillment mode classification
ALTER TABLE products ADD COLUMN IF NOT EXISTS fulfillment_mode TEXT NOT NULL DEFAULT 'auto_license';

-- Add constraint to validate fulfillment_mode values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_fulfillment_mode'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT chk_fulfillment_mode
      CHECK (fulfillment_mode IN ('auto_license', 'manual_vendor', 'manual_service', 'quote_only'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Constraint may already exist, ignore error
  NULL;
END $$;

-- Brand/vendor code for manual_vendor products (e.g., 'microsoft', 'adobe', etc.)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_code TEXT;

-- Human-readable duration text for manual products (e.g., '1 năm', 'vĩnh viễn', 'theo gói')
ALTER TABLE products ADD COLUMN IF NOT EXISTS duration_text TEXT;

-- Estimated delivery time (e.g., '2-5 ngày làm việc', 'trong 24h')
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_estimate TEXT;

-- JSON schema for delivery fields needed for this product
-- For manual_vendor: { "fields": ["fullName", "phone", "address", "province", "district"] }
-- For manual_service: { "fields": ["serviceType", "notes"] }
-- Stored as TEXT to avoid JSONB compatibility issues
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_field_schema TEXT;

-- Template for customer instructions after order (markdown/text)
-- Example: "Sau khi thanh toán, vui lòng đợi 1-2 ngày để bộ phận giao hàng xử lý."
ALTER TABLE products ADD COLUMN IF NOT EXISTS instruction_template TEXT;

-- Custom email template body for fulfillment notification
-- If NULL, system uses default template
-- Stored as TEXT (markdown format)
ALTER TABLE products ADD COLUMN IF NOT EXISTS email_template TEXT;

-- Index for filtering products by fulfillment mode
CREATE INDEX IF NOT EXISTS idx_products_fulfillment_mode ON products(fulfillment_mode);

-- Index for filtering by brand
CREATE INDEX IF NOT EXISTS idx_products_brand_code ON products(brand_code) WHERE brand_code IS NOT NULL;

COMMIT;
