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
  -d "{\"customerId\":\"cus-demo\",\"appId\":\"app_cap01\",\"licenseKey\":\"WSTL-XXXX-YYYYYY\",\"deviceId\":\"DESKTOP-ABC123\",\"deviceName\":\"KHUONG-LAPTOP\",\"appVersion\":\"2.3.0\"}"
```

## 2b) Deactivate license tu AI-app (chuyen may)

Dung khi user muon chuyen may ngay trong app ma khong vao account web:

```bash
curl -X POST "http://localhost:3900/api/ai-app/licenses/deactivate" \
  -H "Content-Type: application/json" \
  -H "x-ai-app-key: <AI_APP_SHARED_KEY>" \
  -d "{\"customerId\":\"cus-demo\",\"appId\":\"app_cap01\",\"licenseKey\":\"WSTL-XXXX-YYYYYY\",\"deviceId\":\"DESKTOP-ABC123\"}"
```

**Luu y:**
- `deviceId` la optional nhung **nen gui** de server xac minh dung may dang bind moi cho deactivate.
- Neu gui `deviceId` sai (khac may dang bind): server tra `403`.
- Sau khi deactivate thanh cong (`ok: true`): user co the verify lai tren may moi.
- Flow chuyen may: `deactivate (may cu)` → `verify (may moi, deviceId moi)`.
```

## 3) API cho Account/Admin (human flow)

- List license:

```bash
curl -X GET "http://localhost:3900/api/customer/licenses?customerId=cus-demo&appId=app_cap01" \
  -H "Cookie: <customer_or_admin_session_cookie>"
```

- Activate by licenseId:

```bash
curl -X POST "http://localhost:3900/api/licenses/<licenseId>/activate" \
  -H "Content-Type: application/json" \
  -H "Cookie: <customer_or_admin_session_cookie>" \
  -d "{\"customerId\":\"cus-demo\",\"deviceId\":\"DESKTOP-ABC123\",\"deviceName\":\"KHUONG-LAPTOP\"}"
```

- Verify by licenseId:

```bash
curl -X POST "http://localhost:3900/api/licenses/<licenseId>/verify" \
  -H "Content-Type: application/json" \
  -H "Cookie: <customer_or_admin_session_cookie>" \
  -d "{\"customerId\":\"cus-demo\",\"deviceId\":\"DESKTOP-ABC123\",\"deviceName\":\"KHUONG-LAPTOP\"}"
```

- Deactivate by licenseId:

```bash
curl -X POST "http://localhost:3900/api/licenses/<licenseId>/deactivate" \
  -H "Content-Type: application/json" \
  -H "Cookie: <customer_or_admin_session_cookie>" \
  -d "{\"customerId\":\"cus-demo\"}"
```

## 4) Quy uoc response verify cho AI-app

- `ok=true`: key hop le, chua revoke, chua expire.
- `license.status` co the la `active` sau verify.
- `expiresAt=null` nghia la khong dat han (vd one_time theo policy hien tai).
- `lastVerifiedAt` cap nhat moi lan AI-app goi verify.
- `features` la nguon gate chinh phia AIA.
- `grace` gom `allowed`, `graceDays`, `offlineUntil` de xu ly offline mode.
- `updateEntitlement` (moi): thong tin quyen nang cap version.

Vi du response verify:

```json
{
  "ok": true,
  "license": {
    "id": "...",
    "appId": "app_cap01",
    "planCode": "premium",
    "status": "active",
    "lastVerifiedAt": "2026-04-22T11:00:00.000Z"
  },
  "features": ["lesson.basic", "practice.core", "lesson.premium", "ai.voice", "ai.writing"],
  "grace": {
    "allowed": true,
    "graceDays": 7,
    "offlineUntil": "2026-04-29T11:00:00.000Z"
  },
  "updateEntitlement": {
    "ownsBaseApp": true,
    "highestEntitledMajor": 2,
    "currentVersionAllowed": true,
    "sourceProductIds": ["prod-prompt-image-video-lifetime", "prod-prompt-image-video-update-v2"]
  }
}
```

**updateEntitlement - cach dung:**
- `ownsBaseApp`: user da mua app base hay chua. Neu `false` → khong duoc chay app.
- `highestEntitledMajor`: phien ban cao nhat user duoc dung. VD `2` = duoc chay v2.x.
- `currentVersionAllowed`: server da so sanh `appVersion` gui len voi `highestEntitledMajor`. `true` = version hien tai duoc phep. `null` neu khong gui `appVersion`.
- `sourceProductIds`: list productId cua cac license tao nen quyen nay (de trace/debug).

**Luu y khi dung:**
- Gui `appVersion` (VD `"2.3.0"`) trong body cua verify de nhan `currentVersionAllowed`.
- Gui `appVersion` qua query param `?appVersion=2.3.0` khi list licenses.
- Neu `metadata.licenseType` chua duoc set trong product → `highestEntitledMajor = null`, `ownsBaseApp = false`.
  Admin can cap nhat metadata san pham truoc khi feature nay co hieu luc day du.
