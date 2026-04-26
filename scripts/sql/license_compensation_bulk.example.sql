-- Bulk bù ngày license
-- Thay danh sách bên dưới bằng key thực tế và số ngày cần bù.
-- Cách 1: set lại số ngày còn lại tính từ thời điểm chạy SQL.

UPDATE app_licenses AS al
SET expires_at = NOW() + make_interval(days => src.days),
    updated_at = NOW()
FROM (
  VALUES
    ('WSTL-AAAA-BBBB', 23),
    ('WSTL-CCCC-DDDD', 11)
) AS src(license_key, days)
WHERE al.license_key = src.license_key;

-- Cách 2: cộng thêm ngày vào hạn hiện tại đang có.
-- Dùng đoạn này thay cho block phía trên khi cần đền bù thêm.

-- UPDATE app_licenses AS al
-- SET expires_at = GREATEST(COALESCE(al.expires_at, NOW()), NOW()) + make_interval(days => src.days),
--     updated_at = NOW()
-- FROM (
--   VALUES
--     ('WSTL-AAAA-BBBB', 23),
--     ('WSTL-CCCC-DDDD', 11)
-- ) AS src(license_key, days)
-- WHERE al.license_key = src.license_key;

-- Kiểm tra lại sau khi chạy
-- SELECT license_key, status, expires_at
-- FROM app_licenses
-- WHERE license_key IN ('WSTL-AAAA-BBBB', 'WSTL-CCCC-DDDD');