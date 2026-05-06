-- Migration 033: Đổi app_id từ 'hoctap-cap-01' sang 'app-study-12' trong toàn bộ hệ thống
-- Lý do: hoctap-cap-01 được xóa hoàn toàn khỏi alias system; app-study-12 là ID duy nhất.
-- QUAN TRỌNG: Chạy migration này TRƯỚC khi deploy backend + app mới.
-- Sau migration: client app gửi appId='app-study-12' → backend lookup đúng.

BEGIN;

-- 1. app_licenses: đổi app_id trên toàn bộ license đang tồn tại
UPDATE app_licenses
SET app_id    = 'app-study-12',
    updated_at = NOW()
WHERE app_id = 'hoctap-cap-01';

-- 2. app_license_runtime_leases: đổi app_id (lease ngắn hạn, có thể đang active)
UPDATE app_license_runtime_leases
SET app_id = 'app-study-12'
WHERE app_id = 'hoctap-cap-01';

-- 3. subscriptions: đổi app_id nếu có row cũ
UPDATE subscriptions
SET app_id = 'app-study-12'
WHERE app_id = 'hoctap-cap-01';

-- 4. orders: đổi app_id trên các đơn hàng cũ
UPDATE orders
SET app_id = 'app-study-12'
WHERE app_id = 'hoctap-cap-01';

-- 5. email_notification_events: cập nhật payload nếu cần (optional, chỉ để consistency)
UPDATE email_notification_events
SET payload = jsonb_set(COALESCE(payload, '{}'), '{appId}', '"app-study-12"'),
    updated_at = NOW()
WHERE payload->>'appId' = 'hoctap-cap-01';

-- 6. app_registry: xóa row cũ 'hoctap-cap-01' vì 'app-study-12' đã tồn tại
-- (sau steps 1-5, không còn FK nào trỏ đến hoctap-cap-01 nữa)
DELETE FROM app_registry
WHERE app_id = 'hoctap-cap-01';

-- Kiểm tra: đảm bảo không còn row nào với hoctap-cap-01
DO $$
DECLARE
  cnt_licenses   INT;
  cnt_leases     INT;
  cnt_subs       INT;
  cnt_orders     INT;
BEGIN
  SELECT COUNT(*) INTO cnt_licenses FROM app_licenses WHERE app_id = 'hoctap-cap-01';
  SELECT COUNT(*) INTO cnt_leases   FROM app_license_runtime_leases WHERE app_id = 'hoctap-cap-01';
  SELECT COUNT(*) INTO cnt_subs     FROM subscriptions WHERE app_id = 'hoctap-cap-01';
  SELECT COUNT(*) INTO cnt_orders   FROM orders WHERE app_id = 'hoctap-cap-01';

  IF cnt_licenses > 0 OR cnt_leases > 0 OR cnt_subs > 0 OR cnt_orders > 0 THEN
    RAISE EXCEPTION 'Migration 033 FAILED: vẫn còn row với app_id=hoctap-cap-01 (licenses=%, leases=%, subs=%, orders=%)',
      cnt_licenses, cnt_leases, cnt_subs, cnt_orders;
  END IF;

  RAISE NOTICE 'Migration 033 OK: tất cả app_id đã đổi sang app-study-12.';
END $$;

COMMIT;
