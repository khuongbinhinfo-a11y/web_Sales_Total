# Integration Checklist

Tai lieu nay dung de onboard app moi vao he thong trung tam.
Muc tieu: app nao cung dong bo dung chuan auth, payment, entitlement, license.

## 1. Cach dung checklist
- Moi app moi tao 1 ban copy checklist nay trong ticket/PR.
- Danh dau trang thai: TODO | IN PROGRESS | DONE | BLOCKED.
- Khong cho release neu con hang muc Critical chua DONE.

## 2. Core checklist (ap dung cho moi app)

### 2.1 Identity va auth (Critical)
- [ ] App su dung tai khoan customer trung tam, khong tao he auth rieng.
- [ ] Login/logout dung API v1:
  - POST /api/auth/customer/login
  - GET /api/auth/me
  - POST /api/auth/customer/logout
- [ ] Ho tro register/reset password theo API OTP hien co.
- [ ] Xu ly token/session het han (tu dong refresh hoac yeu cau login lai ro rang).
- [ ] Khong luu credential plaintext o local storage/file system.

### 2.2 Product, order, payment (Critical)
- [ ] Lay catalog tu GET /api/catalog.
- [ ] Tao don qua POST /api/orders (hoac /api/checkout alias).
- [ ] Dieu huong checkout ve web tong (/pay/:orderId).
- [ ] Sau thanh toan, app re-fetch quyen su dung (khong mo feature dua tren UI state cu).
- [ ] Xu ly don pending/failed/cancelled ro rang tren UI.

### 2.3 Entitlement va license (Critical)
- [ ] App chi mo feature khi entitlement active tu backend.
- [ ] Co xu ly downgrade/expired/suspended.
- [ ] Desktop: ho tro bind device khi kich hoat license.
- [ ] Desktop: co offline mode co han ngan va co buoc verify lai server.

### 2.4 Telemetry va support (High)
- [ ] Gui appVersion trong request den backend (header hoac body field).
- [ ] Gui deviceId (desktop) theo chuan fingerprint da thong nhat.
- [ ] Co ma loi ngu canh khi verify license/auth that bai de CSKH trace nhanh.
- [ ] Co man hinh/luong lien he ho tro khi loi thanh toan hoac kich hoat.

### 2.5 Bao mat va tuan thu (Critical)
- [ ] Khong hardcode key/secret trong app.
- [ ] Khong cho phep bypass entitlement bang cach sua local state.
- [ ] Tat ca request nhay cam di qua HTTPS (production).
- [ ] Log phai an thong tin nhay cam (email day du, token, payment payload raw).

## 3. Checklist rieng cho Webapp
- [ ] Dung cookie session/CSRF strategy theo backend hien tai.
- [ ] Co route guard cho trang can login.
- [ ] Nut Nang cap/Gia han tro ve web tong checkout.
- [ ] Sau checkout quay lai webapp, bat buoc goi GET /api/auth/me de dong bo.

## 4. Checklist rieng cho Desktop app
- [ ] Co luong login qua web tong (browser + callback/deep-link) hoac API login truc tiep.
- [ ] Co secure storage cho token/session (Windows Credential Manager/macOS Keychain neu co).
- [ ] Co co che retry + backoff khi verify license that bai tam thoi.
- [ ] Co limited mode khi het han offline token va khong ket noi duoc server.
- [ ] Co man hinh "Tai khoan va goi dang dung" dong bo voi web tong.

## 5. Checklist rieng cho Admin/Backoffice
- [ ] Role va permission map dung voi API admin.
- [ ] Co audit trail cho thao tac quan tri quan trong.
- [ ] Co bo loc tim customer/order theo email/orderId.
- [ ] Co giao dien xu ly su co thanh toan va webhook.

## 6. Integration test bat buoc truoc release
- [ ] Dang nhap thanh cong + GET /api/auth/me tra dung customer.
- [ ] Tao order thanh cong + checkout URL hop le.
- [ ] Paid webhook cap nhat trang thai va mo quyen dung.
- [ ] Nang cap goi xong quyen duoc dong bo trong <= 60 giay.
- [ ] Het han goi -> app vao limited mode dung policy.
- [ ] Dang xuat xong khong con truy cap du lieu user truoc do.

## 7. Definition of Ready cho app moi
- [ ] Da map appId/productId/plan vao catalog trung tam.
- [ ] Da thong nhat UI text cho cac trang thai: pending, paid, expired, suspended.
- [ ] Da co owner ky thuat + owner van hanh cho app do.

## 8. Definition of Done cho release
- [ ] Pass tat ca muc Critical.
- [ ] Pass integration test bat buoc.
- [ ] Da cap nhat docs/api-changelog.md neu co thay doi API.
- [ ] Da cap nhat docs/platform-standard-v1.md neu co thay doi luong nghiep vu.
