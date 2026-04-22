# AI-app connect commands (Web tong)

Tai lieu nay la bo lenh ket noi nhanh de AI-app (desktop/webapp) goi Web tong.

## 0) Bien moi truong can dat tren Web tong

```env
AI_APP_SHARED_KEY=<mot_secret_dai_it_nhat_32_ky_tu>
```

## 1) Dong bo danh sach license theo customer/app

```bash
curl -X GET "http://localhost:3900/api/ai-app/customers/cus-demo/licenses?appId=app_cap01" \
  -H "x-ai-app-key: <AI_APP_SHARED_KEY>"
```

## 2) Verify license key khi AI-app khoi dong

```bash
curl -X POST "http://localhost:3900/api/ai-app/licenses/verify" \
  -H "Content-Type: application/json" \
  -H "x-ai-app-key: <AI_APP_SHARED_KEY>" \
  -d "{\"customerId\":\"cus-demo\",\"appId\":\"app_cap01\",\"licenseKey\":\"WSTL-XXXX-YYYYYY\",\"deviceId\":\"DESKTOP-ABC123\",\"deviceName\":\"KHUONG-LAPTOP\"}"
```

## 3) API cho Portal/Admin (human flow)

- List license:

```bash
curl -X GET "http://localhost:3900/api/customer/licenses?customerId=cus-demo&appId=app_cap01" \
  -H "Cookie: <portal_or_admin_session_cookie>"
```

- Activate by licenseId:

```bash
curl -X POST "http://localhost:3900/api/licenses/<licenseId>/activate" \
  -H "Content-Type: application/json" \
  -H "Cookie: <portal_or_admin_session_cookie>" \
  -d "{\"customerId\":\"cus-demo\",\"deviceId\":\"DESKTOP-ABC123\",\"deviceName\":\"KHUONG-LAPTOP\"}"
```

- Verify by licenseId:

```bash
curl -X POST "http://localhost:3900/api/licenses/<licenseId>/verify" \
  -H "Content-Type: application/json" \
  -H "Cookie: <portal_or_admin_session_cookie>" \
  -d "{\"customerId\":\"cus-demo\",\"deviceId\":\"DESKTOP-ABC123\",\"deviceName\":\"KHUONG-LAPTOP\"}"
```

- Deactivate by licenseId:

```bash
curl -X POST "http://localhost:3900/api/licenses/<licenseId>/deactivate" \
  -H "Content-Type: application/json" \
  -H "Cookie: <portal_or_admin_session_cookie>" \
  -d "{\"customerId\":\"cus-demo\"}"
```

## 4) Quy uoc response verify cho AI-app

- `ok=true`: key hop le, chua revoke, chua expire.
- `license.status` co the la `active` sau verify.
- `expiresAt=null` nghia la khong dat han (vd one_time theo policy hien tai).
- `lastVerifiedAt` cap nhat moi lan AI-app goi verify.
