-- Test bù ngày cho 1 khách trước
-- Đổi license_key và số ngày theo ca thực tế.

UPDATE app_licenses
SET expires_at = NOW() + INTERVAL '23 days',
    updated_at = NOW()
WHERE license_key = 'WSTL-AAAA-BBBB';

-- Nếu muốn cộng thêm vào hạn cũ thay vì set lại từ hôm nay, dùng câu này:
-- UPDATE app_licenses
-- SET expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + INTERVAL '23 days',
--     updated_at = NOW()
-- WHERE license_key = 'WSTL-AAAA-BBBB';

-- Kiểm tra lại ngay sau khi chạy
-- SELECT license_key, status, expires_at
-- FROM app_licenses
-- WHERE license_key = 'WSTL-AAAA-BBBB';