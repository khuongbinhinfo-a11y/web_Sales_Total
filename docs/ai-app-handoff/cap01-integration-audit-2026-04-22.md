# Cap01 Integration Audit - 2026-04-22

Tai lieu nay tong hop 2 viec:
- Bang da noi/chua noi giua AI-app Cap01 va Web tong.
- Xac nhan endpoint nao tren Web tong da co implementation that, endpoint nao moi o muc tai lieu/ke hoach.

## 1. Bang da noi / chua noi

| Hang muc | Trang thai | Phia AI-app | Endpoint Web tong | Ghi chu |
|---|---|---|---|---|
| Lay catalog san pham | Da noi | `WebSalesTotalService.ts` | `GET /api/catalog` | Da xac nhan trong onboarding ticket |
| Tao order | Da noi | `WebSalesTotalService.ts` | `POST /api/orders` | Tra ve `checkoutUrl=/pay/:orderId` |
| Checkout redirect | Da noi | `PricingPage.tsx` | Trang `/pay/:orderId` | AI-app mo tab checkout cua Web tong |
| Kiem tra trang thai order sau checkout | Da noi | `/payments/web-total/orders/:orderId/status` tren AI-app bridge | `GET /api/orders/:orderId` | AI-app dang proxy lai Web tong |
| Product map app-study-12 | Da noi | `WEB_TOTAL_PRODUCT_MAP_JSON` | `GET /api/catalog` la source | Da dong bo lai theo file handoff trung tam |
| Dang nhap customer qua bridge backend | Da noi mot phan | `WebTotalBridgeSessionService.ts`, `authBridgeController.ts` | `POST /api/auth/customer/login` | Backend bridge co, UI login trong app chua xong |
| Lay thong tin user sau login | Da noi mot phan | `authBridgeController.ts` | `GET /api/auth/me` | Web tong tra snapshot user dang login |
| Dang xuat customer | Da noi mot phan | `authBridgeController.ts` | `POST /api/auth/customer/logout` | Backend bridge co, UI app chua hoan tat |
| Dang nhap Google trong AI-app | Chua noi | Chua thay bang chung trong Cap01 | `GET /api/auth/google/config`, `POST /api/auth/customer/google` | Web tong da co API, nhung AI-app Cap01 chua ghi nhan tich hop |
| Register qua OTP | Chua noi | TODO | `POST /api/auth/customer/register/send-code`, `POST /api/auth/customer/register` | Moi o backlog |
| Reset password qua OTP | Chua noi | TODO | `POST /api/auth/customer/password-reset/send-code`, `POST /api/auth/customer/password-reset/confirm` | Moi o backlog |
| Dong bo license list cho AI-app | Da co contract, chua thay bang chung goi that tu Cap01 | AI-app connect commands | `GET /api/ai-app/customers/:customerId/licenses` | Web tong da implement |
| Verify license key cho AI-app | Da co contract, chua thay bang chung goi that tu Cap01 | AI-app connect commands | `POST /api/ai-app/licenses/verify` | Web tong da implement |
| Activate license qua human flow | Da co contract | Account/Admin | `POST /api/licenses/:licenseId/activate` | Da implement tren Web tong |
| Verify license qua human flow | Da co contract | Account/Admin | `POST /api/licenses/:licenseId/verify` | Da implement tren Web tong |
| Deactivate license qua human flow | Da co contract | Account/Admin | `POST /api/licenses/:licenseId/deactivate` | Da implement tren Web tong |
| Device binding desktop | Chua noi | TODO | Dung trong license activate/verify | Web tong nhan `deviceId/deviceName`, AI-app chua hoan tat |
| Offline grace mode | Chua noi | TODO | Phu thuoc response verify license | Moi o backlog |
| Session persistence | Chua noi | TODO | Khong phu thuoc endpoint moi | Bridge session AI-app hien in-memory |
| Secure storage bridge token | Chua noi | TODO | Khong phu thuoc endpoint moi | Can Windows Credential Manager |
| Top-up 300 credit | Chua noi | TODO | `POST /api/orders` voi `prod-study-topup` | Product da co, AI-app chua tich hop |
| Telemetry `appVersion` / `deviceId` | Chua noi | TODO | Chua co quy uoc header bat buoc trong backend hien tai | Moi ghi trong checklist |

## 2. Xac nhan endpoint Web tong

### 2.1 Endpoint da co implementation that trong backend

| Endpoint | Trang thai | Bang chung code |
|---|---|---|
| `GET /api/catalog` | Da implement | `src/server.js` + `getPublicCatalog()` |
| `POST /api/orders` | Da implement | `src/server.js` + `handleCreateOrder()` |
| `POST /api/checkout` | Da implement | Alias cua `handleCreateOrder()` |
| `GET /api/orders/:orderId` | Da implement | `src/server.js` |
| `POST /api/auth/customer/login` | Da implement | `src/server.js` |
| `GET /api/auth/me` | Da implement | `src/server.js` |
| `POST /api/auth/customer/logout` | Da implement | `src/server.js` |
| `POST /api/auth/customer/register/send-code` | Da implement | `src/server.js` |
| `POST /api/auth/customer/register` | Da implement | `src/server.js` |
| `POST /api/auth/customer/password-reset/send-code` | Da implement | `src/server.js` |
| `POST /api/auth/customer/password-reset/confirm` | Da implement | `src/server.js` |
| `GET /api/auth/google/config` | Da implement | `src/server.js` |
| `POST /api/auth/customer/google` | Da implement | `src/server.js` |
| `GET /api/customer/licenses` | Da implement | `src/server.js` |
| `POST /api/licenses/:licenseId/activate` | Da implement | `src/server.js` |
| `POST /api/licenses/:licenseId/verify` | Da implement | `src/server.js` |
| `POST /api/licenses/:licenseId/deactivate` | Da implement | `src/server.js` |
| `GET /api/ai-app/customers/:customerId/licenses` | Da implement | `src/server.js` |
| `POST /api/ai-app/licenses/verify` | Da implement | `src/server.js` |

### 2.2 Endpoint chi thay trong tai lieu AI-app bridge, khong phai route truc tiep cua Web tong

| Endpoint/ten goi trong tai lieu AI-app | Trang thai tren Web tong | Ghi chu |
|---|---|---|
| `/payments/web-total/orders/:orderId/status` | Khong ton tai truc tiep | Day la route bridge cua AI-app, no phai proxy sang `GET /api/orders/:orderId` |
| `/customer/snapshot` | Khong ton tai truc tiep voi path nay | AI-app phai dung `GET /api/auth/me` cho current user, hoac admin route `GET /api/customers/:customerId/snapshot` neu duoc cap quyen |
| `loginWebTotalBridge`, `getBridgeToken`, `savePendingCheckout` | Khong phai endpoint Web tong | Day la helper/service phia AI-app |

### 2.3 Hang muc moi o muc ke hoach, chua thay endpoint rieng hoac chua thay AI-app dung that

| Hang muc | Trang thai | Ghi chu |
|---|---|---|
| Offline grace mode desktop | Chua hoan tat end-to-end | Response verify co mo ta trong tai lieu, nhung can xac nhan implementation day du phia AI-app |
| Telemetry `appVersion` / `deviceId` | Chua thay contract header ro rang trong backend thong thuong | Moi o checklist/pending work |
| Secure storage bridge token | Khong thuoc Web tong | Thuoc implementation cua AI-app |
| Session persistence bridge | Khong thuoc Web tong | Thuoc implementation cua AI-app |
| Top-up credit `prod-study-topup` | Web tong co san pham, AI-app chua noi | Chua thay bang chung trong ticket Cap01 |

## 3. Ket luan nhanh

- AI-app Cap01 da noi duoc phan xuong song voi Web tong: catalog, order, checkout redirect, order status sync, auth bridge backend, product map.
- Web tong da co implementation that cho toan bo endpoint cot loi ma AI-app can dung o giai doan nay, bao gom ca nhom license/AI-app endpoints.
- Phan con thieu hien tai chu yeu nam o phia AI-app: auth UI, session persistence, secure storage, device binding, offline grace, top-up, telemetry.
- Mot so path trong tai lieu Cap01 la route bridge noi bo cua AI-app, khong phai route public truc tiep cua Web tong.