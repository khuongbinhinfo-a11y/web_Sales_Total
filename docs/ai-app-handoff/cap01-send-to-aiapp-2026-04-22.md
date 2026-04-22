# Cap01 Send-To-AIApp - 2026-04-22

Tai lieu ngan gon de gui thang cho AI-app.

## Bang chuc nang / endpoint / trang thai

| Chuc nang | Endpoint Web tong dung | Trang thai |
|---|---|---|
| Lay catalog san pham | `GET /api/catalog` | Da noi |
| Tao order | `POST /api/orders` | Da noi |
| Checkout redirect | Trang `/pay/:orderId` tu `checkoutUrl` | Da noi |
| Kiem tra trang thai order sau checkout | `GET /api/orders/:orderId` | Da noi |
| Dang nhap customer | `POST /api/auth/customer/login` | Da noi mot phan qua bridge backend |
| Lay thong tin customer dang login | `GET /api/auth/me` | Da noi mot phan qua bridge backend |
| Dang xuat customer | `POST /api/auth/customer/logout` | Da noi mot phan qua bridge backend |
| Dang ky qua OTP | `POST /api/auth/customer/register/send-code`, `POST /api/auth/customer/register` | Chua noi |
| Reset password qua OTP | `POST /api/auth/customer/password-reset/send-code`, `POST /api/auth/customer/password-reset/confirm` | Chua noi |
| Dang nhap Google | `GET /api/auth/google/config`, `POST /api/auth/customer/google` | Chua noi |
| List license cho AI-app | `GET /api/ai-app/customers/:customerId/licenses` | Da co contract, chua thay bang chung goi that |
| Verify license key cho AI-app | `POST /api/ai-app/licenses/verify` | Da co contract, chua thay bang chung goi that |
| Activate license | `POST /api/licenses/:licenseId/activate` | Da co implementation tren Web tong |
| Verify license | `POST /api/licenses/:licenseId/verify` | Da co implementation tren Web tong |
| Deactivate license | `POST /api/licenses/:licenseId/deactivate` | Da co implementation tren Web tong |
| Top-up 300 credit | `POST /api/orders` voi `productId=prod-study-topup` | Chua noi |

## Product map xac nhan

- App ID: `app-study-12`
- Product map source of truth: `docs/ai-app-handoff/WEB_TOTAL_PRODUCT_MAP_JSON.json`

### Plan -> productId

| planId | billingCycle | productId |
|---|---|---|
| standard | monthly | `prod-study-month` |
| standard | yearly | `prod-study-year` |
| standard | lifetime | `prod-study-standard-lifetime` |
| premium | monthly | `prod-study-premium-month` |
| premium | yearly | `prod-study-premium-year` |
| premium | lifetime | `prod-study-premium-lifetime` |
| basic | any | `null` |

## Ghi chu quan trong

- AI-app khong duoc goi endpoint ngoai OpenAPI va ngoai cac route da xac nhan trong tai lieu nay.
- Sau checkout, AI-app phai re-fetch `GET /api/orders/:orderId` va/hoac `GET /api/auth/me` de dong bo quyen.
- Cac path bridge noi bo cua AI-app khong phai la public API cua Web tong.