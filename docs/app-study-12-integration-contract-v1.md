# Ban Chot Chuan Tich Hop 1 Trang (App <-> Web)

- Phien ban: v1.0
- Ap dung cho: `app-study-12` (Phan mem on tap cho khoi cap 01 va Tien Tieu hoc)
- Trang thai: Approved for deployment

## 1. Muc tieu

- Dung chung 1 contract cho 2 team App va Web.
- Chot cung nguon gia, map goi, payload verify, ma loi, checklist deploy.
- Tranh lech quyen/goi/gia khi release.

## 2. Nguon Su That (Source of Truth)

- Gia ban va Product ID: Web Tong.
- Quyen mo lop trong App: theo `planId` sau khi verify key thanh cong.
- App khong tu suy luan gia local de hien thi/chot thanh toan khi da co du lieu Web.
- Thu tu resolve plan khi verify:
  1. `license.metadata.planId` hoac `license.metadata.productId`
  2. `license.planId` hoac `license.productId`
  3. `license.planCode`
  4. Fallback cuoi cung moi dung pattern key

## 3. Bang Contract Dung Chung (Plan <-> Product <-> Gia <-> Quyen)

| planId | Product ID chuan | Chu ky | Gia (VND) | Quyen lop trong App |
| --- | --- | --- | ---: | --- |
| `free` | `none` | `free` | 0 | Free mac dinh |
| `standard` | `prod-study-month` | `monthly` | 89,000 | Mo 3 lop |
| `standard` | `prod-study-year` | `yearly` | 599,000 | Mo 3 lop |
| `standard` | `prod-study-standard-lifetime` | `lifetime` | 1,299,000 | Mo 3 lop |
| `standard_1year_1grade` | `standard_1year_1grade` | `yearly` | 299,000 | Mo dung 1 lop |
| `standard_1year_3grade` | `prod-study-year` | `yearly` | 599,000 | Mo 3 lop (map tu key WSTL 599, uu tien metadata/productId) |
| `premium` | `prod-study-premium-month` | `monthly` | 119,000 (test hien tai) | Premium |
| `premium` | `prod-study-premium-year` | `yearly` | 899,000 (test hien tai) | Premium |
| `premium` | `prod-study-premium-lifetime` | `lifetime` | 1,599,000 (test hien tai) | Premium |

Ghi chu:
- `appId` co dinh trong flow hien tai: `app-study-12`.
- Goi 599k co the map ve `standard` hoac `standard_1year_3grade` tuy `metadata.productId`/`metadata.planId` tra ve tu Web.

## 4. API Verify va Payload Ky Vong

Endpoint verify:
- `POST /api/ai-app/licenses/verify`

Request body toi thieu:
- `appId: string` bat buoc
- `licenseKey: string` bat buoc
- `customerId: string` khuyen nghi
- `deviceId: string` khuyen nghi
- `deviceName: string` khuyen nghi

Response thanh cong (`200`):
- `ok: true`
- `license`:
  1. `id`
  2. `customerId`
  3. `appId`
  4. `productId`
  5. `planCode`
  6. `billingCycle`
  7. `licenseKey`
  8. `status`
  9. `activatedAt`
  10. `expiresAt`
  11. `deviceId`
  12. `deviceName`
  13. `lastVerifiedAt`
  14. `metadata` (uu tien `metadata.planId`, `metadata.productId`)
  15. `features`
  16. `grace` (`allowed`, `graceDays`, `offlineUntil`)
- `tier`: optional
- `features`: array
- `grace`: object

Quy uoc xu ly o App:
- App phai resolve `planId` theo thu tu uu tien da chot tai Muc 2.
- App chi mo quyen tra phi sau khi verify key thanh cong.
- Login khong duoc tu dong mo Standard/Premium.

## 5. Chuan Ma Loi Dung Chung

| HTTP | errorCode | Khi nao |
| --- | --- | --- |
| `400` | `INVALID_REQUEST` | Thieu `appId`/`licenseKey` hoac payload sai |
| `401` | `UNAUTHORIZED_APP_KEY` | Thieu/sai `x-ai-app-key` |
| `404` | `LICENSE_NOT_FOUND_OR_INVALID` | Key sai, het han, revoked |
| `409` | `DEVICE_MISMATCH` | Key da bind thiet bi khac |
| `500` | `INTERNAL_ERROR` | Loi he thong |

Quy uoc response loi:
- `ok: false`
- `errorCode: string`
- `message: string`

## 6. Rule Cap Quyen Trong App (Bat Buoc)

- Chi mo goi tra phi khi verify key thanh cong.
- Login khong tu mo Standard/Premium.
- Mapping quyen lop:
  1. `free`: 1 lop mac dinh theo luat Free
  2. `standard`: 3 lop
  3. `standard_1year_1grade`: dung 1 lop
  4. `standard_1year_3grade`: dung 3 lop
  5. `premium`: full quyen Premium

## 7. Checklist Deploy Bat Buoc Truoc Cutover

### Team Web

1. Xac nhan day du Product ID trong bang contract.
2. Verify endpoint tra du `metadata.planId` hoac `metadata.productId`.
3. Chot behavior ma loi dung bang chuan.
4. Test live 4 case: key dung, key sai, key het han/revoked, device mismatch.

### Team App

1. Doc plan theo thu tu uu tien da chot.
2. Khong hardcode gia local de ghi de khi da co gia Web.
3. Enforce quyen lop dung theo `planId`.
4. Test E2E mua goi -> nhan key -> verify -> mo dung quyen.

### Kiem thu lien thong chung

1. Standard thang 89k.
2. Standard nam 599k.
3. Standard 1 nam 1 lop 299k.
4. Premium thang/nam/tron doi theo gia test da chot.
5. Sai key phai ra dung loi contract.
6. Khoa thiet bi phai ra `409 DEVICE_MISMATCH`.

## 8. Dieu Kien Release

- Web va App deu pass checklist bat buoc.
- Verify payload va ma loi khop contract nay.
- Khong con tinh trang App tu suy luan sai goi/gia khi Web da tra metadata/productId.
- Case `409 DEVICE_MISMATCH` duoc xem la business/device-binding flow, khong phai route failure.
- Thu tu cleanup/deploy/rollback theo commit duoc chot tai `docs/app-study-12-safe-cleanup-runbook-v1.md`.

## 9. Ket Luan Chot

- Contract nay la tai lieu chot dung chung cho App va Web trong dot cutover hien tai cua `app-study-12`.
- Moi thay doi lien quan `planId`, `productId`, gia, payload verify hoac ma loi phai cap nhat lai tai lieu nay truoc khi release.