# Platform Standard v1

Tai lieu nay la bo chuan v1 de dong bo giua web tong, desktop app va webapp.

## 1. Muc tieu v1
- Mot trung tam du lieu duy nhat cho account, order, payment, license.
- Moi app chi la client (desktop/webapp/admin), khong tu quan ly logic license rieng.
- Dam bao khach mua moi, nang cap, gia han, het han deu dong bo cung mot luong.

## 2. Nguyen tac kien truc
- Source of truth: web tong (backend Node/Express + PostgreSQL).
- Desktop app va webapp:
  - Dang nhap bang tai khoan trung tam.
  - Goi API trung tam de lay quyen su dung (entitlements/license).
  - Khong ghi de trang thai license local theo kieu vinh vien.
- Admin/backoffice quan ly product, plan, key va doi soat tren web tong.

## 3. Dinh danh va doi tuong chung
- customer: nguoi dung cuoi, dang nhap mot tai khoan cho moi app.
- appId: nhom phan mem (vi du: hoctap, lamviec).
- productId: san pham cu the trong appId.
- plan: monthly | yearly | lifetime.
- entitlement: quyen dang su dung cua customer theo appId/productId/plan.
- license: ma kich hoat va rang buoc thiet bi (uu tien cho desktop).

## 4. Auth va session v1

### 4.1 Webapp (trinh duyet)
- Dung cookie session hien co:
  - POST /api/auth/customer/register/send-code
  - POST /api/auth/customer/register
  - POST /api/auth/customer/login
  - GET /api/auth/me
  - POST /api/auth/customer/logout
- Muc tieu: giu nguyen de khong vo luong web hien tai.

### 4.2 Desktop app
- Chuan v1 de xai chung backend:
  - Cach 1 (khuyen nghi nhanh): desktop mo man hinh login web tong trong browser, sau login lay session token qua callback/deep-link.
  - Cach 2: desktop goi truc tiep login API roi luu token/cookie secure local.
- Bat buoc:
  - Desktop phai co ham refresh phien dang nhap.
  - Neu mat mang, desktop dung cache quyen tam thoi co han ngan (de xai offline), het han thi buoc re-check server.

## 5. Luong nghiep vu bat buoc

### 5.1 Mua moi
1. User chon goi tren webapp/desktop.
2. App goi POST /api/orders (hoac POST /api/checkout alias).
3. User thanh toan tren trang /pay/:orderId.
4. Webhook payment cap nhat paid.
5. He thong cap entitlement/license.
6. App goi GET /api/auth/me hoac endpoint entitlement de dong bo quyen.

### 5.2 Nang cap goi
1. App hien nut Nang cap va dieu huong ve web tong checkout.
2. Sau thanh toan, backend xu ly policy nang cap.
3. App re-fetch trang thai quyen de mo feature theo goi moi.

### 5.3 Gia han goi
- Tuong tu nang cap, nhung bo sung quy tac cong don han su dung (neu policy cho phep).

## 6. API contract v1 (bat buoc cho tat ca app)

## 6.1 Public va catalog
- GET /api/health
- GET /api/catalog

## 6.2 Auth customer
- POST /api/auth/customer/register/send-code
- POST /api/auth/customer/register
- POST /api/auth/customer/login
- GET /api/auth/me
- POST /api/auth/customer/logout
- POST /api/auth/customer/password-reset/send-code
- POST /api/auth/customer/password-reset/confirm
- GET /api/auth/google/config
- POST /api/auth/customer/google

## 6.3 Order va payment
- POST /api/orders
- POST /api/checkout (alias)
- GET /api/orders/:orderId
- POST /api/payments/webhooks
- POST /api/payments/webhooks/sepay
- POST /api/payments/webhooks/stripe
- POST /api/payments/mock/confirm

## 6.4 Snapshot, account, usage
- GET /api/account/overview
- POST /api/account/downloads/:appId
- GET /api/customers/:customerId/snapshot (admin permission)
- POST /api/usage/consume

## 6.5 Admin
- GET /api/admin/me
- GET /api/admin/dashboard
- GET /api/admin/users
- POST /api/admin/users
- GET /api/admin/admin-users
- POST /api/admin/admin-users
- PATCH /api/admin/admin-users/:adminId

## 7. Cac endpoint bo sung nen them ngay trong sprint tiep theo
- GET /api/me/entitlements
  - Muc dich: desktop/webapp lay quyen theo customer dang login, khong can truyen customerId tay.
- POST /api/licenses/activate
  - Muc dich: kich hoat license cho desktop va bind device.
- POST /api/licenses/verify
  - Muc dich: desktop check license dinh ky.
- POST /api/licenses/refresh-offline-token
  - Muc dich: cap token offline co han ngan.
- POST /api/billing/upgrade-preview
  - Muc dich: xem truoc phi nang cap (prorate) truoc khi thanh toan.

## 8. Quy tac dong bo desktop va webapp
- Moi thay doi sau thanh toan phai doi boi event "paid" tu backend.
- App client chi mo tinh nang khi API tra entitlement active.
- Co che fallback:
  - Online: re-fetch /api/auth/me + entitlement ngay sau checkout.
  - Offline: cho phep chay trong khoang thoi gian ngan theo offline token.
- Het han offline token ma khong ket noi duoc server: chuyen ve trang thai limited mode.

## 9. Chuan versioning va phoi hop nhieu app
- Prefix tai lieu va API theo version: v1.
- Mọi thay doi breaking:
  - Tao changelog.
  - Co thoi gian chuyen doi.
  - Khong xoa endpoint cu ngay lap tuc.
- De nghi tao workspace chung tai lieu:
  - docs/platform-standard-v1.md (tai lieu tong)
  - docs/api-changelog.md (lich su thay doi)
  - docs/integration-checklist.md (checklist cho tung app)

## 10. Checklist trien khai cho moi app moi
- Bat buoc login qua auth trung tam.
- Bat buoc dong bo entitlement sau login va sau thanh toan.
- Bat buoc co man hinh quan ly goi va nut Nang cap tro ve web tong.
- Bat buoc xu ly het han quyen va thong bao ro rang cho user.
- Bat buoc gui appVersion + deviceId khi verify license (desktop).

## 11. Ke hoach sprint de dat chuan v1
- Sprint 1:
  - Chot API contract cho auth, order, me/snapshot.
  - Chay thong desktop login voi web tong.
- Sprint 2:
  - Them endpoint entitlements va license activate/verify.
  - Hoan thien flow nang cap/gia han.
- Sprint 3:
  - Hoan thien offline token + telemetry + dashboard quan ly license.

## 12. Quyet dinh kien truc cho team
- Team thong nhat web tong la trung tam dieu phoi.
- Moi app moi phai pass integration checklist truoc khi release.
- Moi thay doi lien quan auth/payment/license phai cap nhat tai lieu nay truoc khi merge.
