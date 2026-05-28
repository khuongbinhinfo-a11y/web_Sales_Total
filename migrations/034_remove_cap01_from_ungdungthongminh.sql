-- Migration 034: Hard delete Cap 01 sales data from Ung Dung Thong Minh
-- Scope:
-- - app_id: app-study-12, hoctap-cap-01
-- - product_id list: all Cap 01 sale products and legacy beta product
-- - Safe to run only after preflight confirms no real paid orders / real licenses

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.app_license_runtime_leases') IS NOT NULL THEN
    DELETE FROM app_license_runtime_leases
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.app_licenses') IS NOT NULL THEN
    DELETE FROM app_licenses
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
       OR product_id = ANY(ARRAY[
         'cap01_standard_1year_3grades',
         'cap01_grade_la_1year',
         'cap01_grade_1_1year',
         'cap01_grade_2_1year',
         'cap01_grade_3_1year',
         'cap01_grade_4_1year',
         'cap01_grade_5_1year',
         'prod-study-month',
         'prod-study-year',
         'prod-study-premium-month',
         'prod-study-premium-year',
         'prod-study-standard-lifetime',
         'prod-study-premium-lifetime',
         'prod-study-topup',
         'standard_1year_1grade',
         'cap01_beta_year_299'
       ]::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.order_key_deliveries') IS NOT NULL THEN
    DELETE FROM order_key_deliveries d
    USING orders o
    WHERE d.order_id = o.id
      AND (
        o.app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
        OR o.product_id = ANY(ARRAY[
          'cap01_standard_1year_3grades',
          'cap01_grade_la_1year',
          'cap01_grade_1_1year',
          'cap01_grade_2_1year',
          'cap01_grade_3_1year',
          'cap01_grade_4_1year',
          'cap01_grade_5_1year',
          'prod-study-month',
          'prod-study-year',
          'prod-study-premium-month',
          'prod-study-premium-year',
          'prod-study-standard-lifetime',
          'prod-study-premium-lifetime',
          'prod-study-topup',
          'standard_1year_1grade',
          'cap01_beta_year_299'
        ]::text[])
        OR d.product_id = ANY(ARRAY[
          'cap01_standard_1year_3grades',
          'cap01_grade_la_1year',
          'cap01_grade_1_1year',
          'cap01_grade_2_1year',
          'cap01_grade_3_1year',
          'cap01_grade_4_1year',
          'cap01_grade_5_1year',
          'prod-study-month',
          'prod-study-year',
          'prod-study-premium-month',
          'prod-study-premium-year',
          'prod-study-standard-lifetime',
          'prod-study-premium-lifetime',
          'prod-study-topup',
          'standard_1year_1grade',
          'cap01_beta_year_299'
        ]::text[])
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.product_keys') IS NOT NULL THEN
    UPDATE product_keys
    SET delivered_order_id = NULL, reserved_order_id = NULL, updated_at = NOW()
    WHERE product_id = ANY(ARRAY[
      'cap01_standard_1year_3grades',
      'cap01_grade_la_1year',
      'cap01_grade_1_1year',
      'cap01_grade_2_1year',
      'cap01_grade_3_1year',
      'cap01_grade_4_1year',
      'cap01_grade_5_1year',
      'prod-study-month',
      'prod-study-year',
      'prod-study-premium-month',
      'prod-study-premium-year',
      'prod-study-standard-lifetime',
      'prod-study-premium-lifetime',
      'prod-study-topup',
      'standard_1year_1grade',
      'cap01_beta_year_299'
    ]::text[]);
    DELETE FROM product_keys
    WHERE product_id = ANY(ARRAY[
      'cap01_standard_1year_3grades',
      'cap01_grade_la_1year',
      'cap01_grade_1_1year',
      'cap01_grade_2_1year',
      'cap01_grade_3_1year',
      'cap01_grade_4_1year',
      'cap01_grade_5_1year',
      'prod-study-month',
      'prod-study-year',
      'prod-study-premium-month',
      'prod-study-premium-year',
      'prod-study-standard-lifetime',
      'prod-study-premium-lifetime',
      'prod-study-topup',
      'standard_1year_1grade',
      'cap01_beta_year_299'
    ]::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.credit_wallets') IS NOT NULL THEN
    DELETE FROM credit_wallets
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.payment_webhook_events') IS NOT NULL THEN
    DELETE FROM payment_webhook_events pwe
    USING orders o
    WHERE pwe.order_id = o.id
      AND (
        o.app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
        OR o.product_id = ANY(ARRAY[
          'cap01_standard_1year_3grades',
          'cap01_grade_la_1year',
          'cap01_grade_1_1year',
          'cap01_grade_2_1year',
          'cap01_grade_3_1year',
          'cap01_grade_4_1year',
          'cap01_grade_5_1year',
          'prod-study-month',
          'prod-study-year',
          'prod-study-premium-month',
          'prod-study-premium-year',
          'prod-study-standard-lifetime',
          'prod-study-premium-lifetime',
          'prod-study-topup',
          'standard_1year_1grade',
          'cap01_beta_year_299'
        ]::text[])
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.payment_transactions') IS NOT NULL THEN
    DELETE FROM payment_transactions pt
    USING orders o
    WHERE pt.order_id = o.id
      AND (
        o.app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
        OR o.product_id = ANY(ARRAY[
          'cap01_standard_1year_3grades',
          'cap01_grade_la_1year',
          'cap01_grade_1_1year',
          'cap01_grade_2_1year',
          'cap01_grade_3_1year',
          'cap01_grade_4_1year',
          'cap01_grade_5_1year',
          'prod-study-month',
          'prod-study-year',
          'prod-study-premium-month',
          'prod-study-premium-year',
          'prod-study-standard-lifetime',
          'prod-study-premium-lifetime',
          'prod-study-topup',
          'standard_1year_1grade',
          'cap01_beta_year_299'
        ]::text[])
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    -- Clean up product_keys referencing scoped orders (by order_id, not product_id)
    -- These keys have product_ids NOT in the scope array, but their orders ARE in scope
    DELETE FROM product_keys
    WHERE delivered_order_id IN (
      SELECT id FROM orders
      WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
         OR product_id = ANY(ARRAY[
           'cap01_standard_1year_3grades',
           'cap01_grade_la_1year',
           'cap01_grade_1_1year',
           'cap01_grade_2_1year',
           'cap01_grade_3_1year',
           'cap01_grade_4_1year',
           'cap01_grade_5_1year',
           'prod-study-month',
           'prod-study-year',
           'prod-study-premium-month',
           'prod-study-premium-year',
           'prod-study-standard-lifetime',
           'prod-study-premium-lifetime',
           'prod-study-topup',
           'standard_1year_1grade',
           'cap01_beta_year_299'
         ]::text[])
    );

    -- Clean up dependent rows by order_id scope BEFORE deleting orders
    DELETE FROM email_notification_events
    WHERE order_id IN (
      SELECT id FROM orders
      WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
         OR product_id = ANY(ARRAY[
           'cap01_standard_1year_3grades',
           'cap01_grade_la_1year',
           'cap01_grade_1_1year',
           'cap01_grade_2_1year',
           'cap01_grade_3_1year',
           'cap01_grade_4_1year',
           'cap01_grade_5_1year',
           'prod-study-month',
           'prod-study-year',
           'prod-study-premium-month',
           'prod-study-premium-year',
           'prod-study-standard-lifetime',
           'prod-study-premium-lifetime',
           'prod-study-topup',
           'standard_1year_1grade',
           'cap01_beta_year_299'
         ]::text[])
    );

    DELETE FROM credit_ledger
    WHERE order_id IN (
      SELECT id FROM orders
      WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
         OR product_id = ANY(ARRAY[
           'cap01_standard_1year_3grades',
           'cap01_grade_la_1year',
           'cap01_grade_1_1year',
           'cap01_grade_2_1year',
           'cap01_grade_3_1year',
           'cap01_grade_4_1year',
           'cap01_grade_5_1year',
           'prod-study-month',
           'prod-study-year',
           'prod-study-premium-month',
           'prod-study-premium-year',
           'prod-study-standard-lifetime',
           'prod-study-premium-lifetime',
           'prod-study-topup',
           'standard_1year_1grade',
           'cap01_beta_year_299'
         ]::text[])
    );

    DELETE FROM orders
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
       OR product_id = ANY(ARRAY[
         'cap01_standard_1year_3grades',
         'cap01_grade_la_1year',
         'cap01_grade_1_1year',
         'cap01_grade_2_1year',
         'cap01_grade_3_1year',
         'cap01_grade_4_1year',
         'cap01_grade_5_1year',
         'prod-study-month',
         'prod-study-year',
         'prod-study-premium-month',
         'prod-study-premium-year',
         'prod-study-standard-lifetime',
         'prod-study-premium-lifetime',
         'prod-study-topup',
         'standard_1year_1grade',
         'cap01_beta_year_299'
       ]::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    DELETE FROM subscriptions
    WHERE product_id = ANY(ARRAY[
      'cap01_standard_1year_3grades',
      'cap01_grade_la_1year',
      'cap01_grade_1_1year',
      'cap01_grade_2_1year',
      'cap01_grade_3_1year',
      'cap01_grade_4_1year',
      'cap01_grade_5_1year',
      'prod-study-month',
      'prod-study-year',
      'prod-study-premium-month',
      'prod-study-premium-year',
      'prod-study-standard-lifetime',
      'prod-study-premium-lifetime',
      'prod-study-topup',
      'standard_1year_1grade',
      'cap01_beta_year_299'
    ]::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL THEN
    DELETE FROM products
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[])
       OR id = ANY(ARRAY[
         'cap01_standard_1year_3grades',
         'cap01_grade_la_1year',
         'cap01_grade_1_1year',
         'cap01_grade_2_1year',
         'cap01_grade_3_1year',
         'cap01_grade_4_1year',
         'cap01_grade_5_1year',
         'prod-study-month',
         'prod-study-year',
         'prod-study-premium-month',
         'prod-study-premium-year',
         'prod-study-standard-lifetime',
         'prod-study-premium-lifetime',
         'prod-study-topup',
         'standard_1year_1grade',
         'cap01_beta_year_299'
       ]::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.app_registry_checks') IS NOT NULL THEN
    DELETE FROM app_registry_checks
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.app_registry_audit_logs') IS NOT NULL THEN
    DELETE FROM app_registry_audit_logs
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.ai_usage_logs') IS NOT NULL THEN
    DELETE FROM ai_usage_logs
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[]);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.app_registry') IS NOT NULL THEN
    DELETE FROM app_registry
    WHERE app_id = ANY(ARRAY['app-study-12', 'hoctap-cap-01']::text[]);
  END IF;
END $$;

COMMIT;
