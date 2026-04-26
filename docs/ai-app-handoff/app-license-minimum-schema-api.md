# App License Minimum Schema And API

Tai lieu nay de xuat schema du lieu va API toi thieu cho mo hinh:

- login bang tai khoan Web tong
- quyen business nam o entitlement
- quyen kich hoat thuc te nam o app-license/key

## 1. Muc tieu ky thuat

Mo hinh can ho tro duoc:

- nhieu app tren cung mot account
- desktop activation
- device binding
- verify dinh ky
- revoke/suspend/expire ro rang
- offline grace mode
- support tra cuu nhanh

## 2. Quan he du lieu de xuat

### `customers`

- account trung tam
- login, profile, history

### `orders`

- don hang thanh toan

### `order_items`

- item trong don
- xac dinh app/product/plan da mua

### `entitlements`

- business truth
- customer da mua quyen gi

### `licenses`

- don vi kich hoat de tung app su dung
- duoc phat hanh tu order item hoac entitlement

### `license_devices`

- luu thong tin bind theo thiet bi neu can multi-device hoac lich su device

## 3. Schema toi thieu de xuat

### 3.1 Bảng `licenses`

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  app_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  plan_id TEXT,
  billing_cycle TEXT,
  order_id UUID,
  order_item_id UUID,
  entitlement_id UUID,
  status TEXT NOT NULL DEFAULT 'inactive',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  current_device_id TEXT,
  current_device_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

#### Gia tri `status` de xuat

- `inactive`
- `active`
- `suspended`
- `expired`
- `revoked`

### 3.2 Bảng `license_devices`

```sql
CREATE TABLE license_devices (
  id UUID PRIMARY KEY,
  license_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  first_activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

## 4. Nguon su that theo lop

### `Account`

- ai dang su dung he thong

### `Entitlement`

- customer da mua quyen gi theo business

### `License`

- quyen do da duoc cap va dang duoc dung tren app/thiet bi nao

Quy tac de xuat:

- refund/revoke/suspend se cap nhat entitlement va cascade sang license lien quan
- app khong tu y tao license
- chi Web tong duoc phat hanh license

## 5. Luong van hanh toi thieu

### 5.1 Sau thanh toan

1. Order thanh cong.
2. Web tong tao/refresh entitlement.
3. Web tong phat hanh 1 hoac nhieu license tuong ung.
4. Customer thay license trong account va app co the doc qua API.

### 5.2 Khi app dang nhap

1. Dang nhap bang account trung tam.
2. Goi `auth/me` hoac snapshot.
3. Goi danh sach license theo `appId`.
4. Neu can, app activate/bind license vao device.
5. App mo tinh nang dua tren `entitlement + license status`.

### 5.3 Khi offline

- app duoc phep dung trong grace period ngan dua tren lan verify gan nhat
- khi online lai, app re-verify voi Web tong

## 6. API toi thieu de xuat

### 6.1 Lay danh sach license cua customer theo app

`GET /api/customer/licenses?appId=app-study-12`

Response mau:

```json
{
  "ok": true,
  "items": [
    {
      "id": "lic_123",
      "licenseKey": "WST-AAA-BBB-CCC",
      "appId": "app-study-12",
      "productId": "prod-study-year",
      "planId": "standard",
      "billingCycle": "yearly",
      "status": "active",
      "issuedAt": "2026-04-22T08:00:00.000Z",
      "activatedAt": "2026-04-22T08:10:00.000Z",
      "expiresAt": "2027-04-22T08:00:00.000Z",
      "currentDeviceId": "device-001",
      "currentDeviceName": "DESKTOP-OFFICE",
      "lastVerifiedAt": "2026-04-22T08:30:00.000Z"
    }
  ]
}
```

### 6.2 Lay chi tiet 1 license

`GET /api/licenses/:licenseId`

Dung cho:

- man hinh chi tiet license
- support tra cuu
- app refresh thong tin chi tiet

### 6.3 Activate license

`POST /api/licenses/:licenseId/activate`

Request mau:

```json
{
  "deviceId": "device-001",
  "deviceName": "DESKTOP-OFFICE",
  "appVersion": "1.0.0"
}
```

Response mau:

```json
{
  "ok": true,
  "license": {
    "id": "lic_123",
    "status": "active",
    "activatedAt": "2026-04-22T08:10:00.000Z",
    "currentDeviceId": "device-001",
    "currentDeviceName": "DESKTOP-OFFICE"
  }
}
```

### 6.4 Verify license

`POST /api/licenses/:licenseId/verify`

Request mau:

```json
{
  "deviceId": "device-001",
  "appVersion": "1.0.0",
  "lastSeenAt": "2026-04-22T08:30:00.000Z"
}
```

Response mau:

```json
{
  "ok": true,
  "license": {
    "id": "lic_123",
    "status": "active",
    "expiresAt": "2027-04-22T08:00:00.000Z",
    "lastVerifiedAt": "2026-04-22T08:30:00.000Z"
  },
  "grace": {
    "allowed": true,
    "offlineUntil": "2026-04-25T08:30:00.000Z"
  }
}
```

### 6.5 Deactivate license

`POST /api/licenses/:licenseId/deactivate`

Request mau:

```json
{
  "deviceId": "device-001",
  "reason": "user-request"
}
```

## 7. Rule xu ly business

### Refund

- order refund => entitlement update
- license lien quan => `revoked` hoac `suspended`

### Het han

- entitlement het han => license sang `expired`

### Doi may

- co the deactivate thiet bi cu va activate lai thiet bi moi

### Support

- CSKH can tra cuu duoc theo:
  - customer
  - order
  - appId
  - license key
  - deviceId

## 8. API toi thieu cho desktop app

Neu chua muon mo public API qua som, co the mo toi thieu 3 API dau tien:

- `GET /api/customer/licenses?appId=...`
- `POST /api/licenses/:licenseId/activate`
- `POST /api/licenses/:licenseId/verify`

Nhu vay da du de desktop app:

- login bang tai khoan tong
- doc license cua tung app
- activate/bind device
- verify lai khi online

## 9. Khuyen nghi trien khai

### Phase 1

- them bang `licenses`
- phat hanh license sau thanh toan
- account hien duoc danh sach license

### Phase 2

- them activate / verify / deactivate
- them `license_devices`
- them offline grace policy

### Phase 3

- multi-seat
- bundle 1 don nhieu license
- reseller/gift
- dashboard support theo app/device

## 10. Contract da chot giua AIT va AIA (v1)

Muc nay la ban chot de 2 ben code dong bo, khong tu suy dien.

### 10.1 Phan vai ro rang

- AIT la nguon su that duy nhat cho license + plan + feature policy.
- AIA chi consume API va gate UX theo du lieu tra ve.
- AIA khong duoc tu map cung plan -> feature neu server da tra ve features.

### 10.2 Quyet dinh feature theo plan

- Quyet dinh cuoi cung thuoc AIT.
- Response verify/list can co `features` (array) hoac `featureFlags` (object).
- AIA uu tien doc `features`; neu vang thi fallback sang map noi bo tam thoi.

Vi du payload de AIA gate:

```json
{
  "ok": true,
  "license": {
    "id": "lic_123",
    "appId": "app_cap01",
    "planCode": "premium",
    "status": "active",
    "expiresAt": "2027-04-22T08:00:00.000Z",
    "lastVerifiedAt": "2026-04-22T08:30:00.000Z"
  },
  "features": [
    "lesson.basic",
    "lesson.premium",
    "ai.voice",
    "ai.writing"
  ]
}
```

### 10.3 Timing phia AIA

Luong bat buoc sau login:

1. login account trung tam
2. goi API list/verify license
3. luu cache local ngan han
4. gate UI theo `features` + `license.status`

### 10.4 Offline grace mode

- Grace khuyen nghi: 3-7 ngay.
- Co so tinh grace: `lastVerifiedAt` + `graceDays`.
- Neu qua grace, AIA downgrade ve basic/read-only (khong can khoa trang app).

Vi du block grace:

```json
{
  "grace": {
    "allowed": true,
    "graceDays": 7,
    "offlineUntil": "2026-04-29T08:30:00.000Z"
  }
}
```

### 10.5 API toi thieu de chay production

- `GET /api/ai-app/customers/:customerId/licenses?appId=...`
- `POST /api/ai-app/licenses/verify`
- `POST /api/licenses/:licenseId/activate` (human/admin flow)
- `POST /api/licenses/:licenseId/deactivate` (human/admin flow)

### 10.6 Nguyen tac tuong thich

- Them field moi trong response: chi add, khong doi nghia field cu.
- Doi nghia field quan trong: tang version contract va cap nhat changelog.
- AIA can co fallback an toan khi field moi chua co tren moi truong cu.

## 10. Ket luan

Schema va API toi thieu tren du de bat dau huong `account + entitlement + app-license` ma khong can lam he thong qua nang ngay tu dau.

No giu duoc 3 muc tieu:

- Web tong van la trung tam
- app co don vi kich hoat ro rang
- he thong de support va mo rong khi so app tang len