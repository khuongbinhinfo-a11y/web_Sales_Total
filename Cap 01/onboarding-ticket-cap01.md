# [APP-ONBOARD][cap01-desktop] Integrate app voi Platform Standard v1

## 1. Metadata
- App name: Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học
- App ID: app-study-12
- App type: desktop (Electron + Vite/React + Express backend)
- Team owner: khuongbinhinfo
- Tech owner: khuongbinhinfo
- Sprint target: Sprint 19 - 20
- Target release date: TBD
- Priority: P1
- Dependencies: Web tong v1.1.0 API

## 2. Business goal
- App su dung chung account, payment va entitlement tu web tong.
- Khong tao auth/payment/license rieng.
- Tat ca order/checkout di qua cong Web tong trung tam.

## 3. App ID / Product mapping (da xac nhan)

| planId     | billingCycle | productId                    | Gia (VND) |
|------------|-------------|------------------------------|-----------|
| standard   | monthly     | prod-study-month             | 89,000    |
| standard   | yearly      | prod-study-year              | 599,000   |
| standard   | lifetime    | prod-study-standard-lifetime | 1,299,000 |
| premium    | monthly     | prod-study-premium-month     | 119,000   |
| premium    | yearly      | prod-study-premium-year      | 899,000   |
| premium    | lifetime    | prod-study-premium-lifetime  | 1,599,000 |
| basic      | *           | null (mien phi)              | 0         |

Top-up credit: prod-study-topup (149,000 VND / 300 credit) — chua tich hop.

## 4. Trang thai tich hop hien tai (Phase 1-3 DONE)

### Phase 1 - Catalog + Order + Checkout [DONE]
- [x] Backend adapter WebSalesTotalService.ts goi GET /api/catalog, POST /api/orders.
- [x] Resolve productId tu WEB_TOTAL_PRODUCT_MAP_JSON (flat map "planId:cycle" -> productId).
- [x] Catch null productId -> bao loi ro rang "goi chua ho tro".
- [x] Fallback: Neu khong set WEB_TOTAL_BASE_URL thi dung QR local SePay.
- [x] Frontend PricingPage.tsx goi backend /payments/create, mo checkoutUrl trong tab moi.

### Phase 2 - Session bridge + Checkout return refresh [DONE]
- [x] Backend WebTotalBridgeSessionService.ts: proxy login -> lay cookie -> luu in-memory.
- [x] authBridgeController.ts: /auth/customer/login, /auth/me, /customer/snapshot, /auth/customer/logout.
- [x] Backend /payments/web-total/orders/:orderId/status: proxy GET /api/orders/:orderId.
- [x] Frontend webTotalBridge.ts: getBridgeToken, loginWebTotalBridge, savePendingCheckout, getWebTotalOrderStatus.
- [x] PricingPage: khi quay lai (window.focus + visibilitychange), tu dong goi getWebTotalOrderStatus.
- [x] syncPaidSubscription: ghi subscription vao Electron SQLite DB sau khi paid confirm.
- [x] Nut manual "Toi da quay lai, kiem tra quyen".

### Phase 3 - Product map chinh xac [DONE]
- [x] WEB_TOTAL_PRODUCT_MAP_JSON dien day du voi productId thuc te tu catalog.
- [x] DEFAULT_APP_ID cap nhat thanh app-study-12.
- [x] cycle "lifetime" map sang "one_time" trong catalog lookup (catalogCyclesFor).
- [x] Null entry check: neu null -> bao loi thay vi fallback sai catalog.
- [x] Premium monthly/yearly da duoc cap productId (prod-study-premium-month, prod-study-premium-year).
- [x] backend/.env da cap nhat day du.

## 5. Con lai chua lam (Peding)

### Auth UI [TODO]
- [ ] Man hinh dang nhap Web tong noi trong app (dung loginWebTotalBridge).
- [ ] Hien thi thong tin tai khoan sau khi dang nhap (getWebTotalMe / getWebTotalCustomerSnapshot).
- [ ] Lien ket bridge session voi student profile hien tai trong app.

### Desktop-specific [TODO]
- [ ] Device binding khi kich hoat license.
- [ ] Offline grace mode (limited mode khi het han offline).
- [ ] Secure storage cho bridge token (Windows Credential Manager thay vi localStorage).

### Register / Reset password [TODO]
- [ ] Chua implement UI reset password qua OTP.
- [ ] Dang ky tai khoan Web tong tu trong app.

### Session persistence [TODO]
- [ ] WebTotalBridgeSessionService hien dung Map<> in-memory -> mat session khi restart backend.
- [ ] Can luu session vao SQLite backend hoac file encrypt.

### Top-up credit [TODO]
- [ ] Chua tich hop goi Top-up 300 Credit (prod-study-topup).

### Telemetry [TODO]
- [ ] Chua gui appVersion trong request.
- [ ] Chua gui deviceId.

## 6. Security notes
- Bridge token co prefix wtb_ luu trong localStorage (chua dung secure storage).
- Backend session in-memory, khong persistent.
- WEB_TOTAL_BASE_URL trong .env, khong hardcode.
- WEB_TOTAL_PRODUCT_MAP_JSON validate qua JSON.parse co try/catch.

## 7. Environment
- WEB_TOTAL_BASE_URL=http://localhost:3900 (dev) / TBD (prod)
- WEB_TOTAL_APP_ID=app-study-12
- Backend: Express + TypeScript + SQLite, port 5000
- Frontend: Electron + Vite/React + Tailwind
