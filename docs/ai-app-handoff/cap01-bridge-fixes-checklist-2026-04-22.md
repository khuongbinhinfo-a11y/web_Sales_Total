# Cap01 Bridge Fixes Checklist - 2026-04-22

Checklist nay dung de AI-app sua cac cho dang dung route bridge-only hoac path khong ton tai truc tiep tren Web tong.

## 1. Path can sua ngay

| Dang dung / dang ghi trong tai lieu AI-app | Phai doi thanh | Ly do |
|---|---|---|
| `/payments/web-total/orders/:orderId/status` | Proxy sang `GET /api/orders/:orderId` | Day khong phai route public cua Web tong |
| `/customer/snapshot` | `GET /api/auth/me` cho current user | Path nay khong ton tai truc tiep tren Web tong |
| `loginWebTotalBridge` nhu mot API Web tong | Giu no la helper/service noi bo AI-app | Khong phai public endpoint |
| `getBridgeToken` nhu mot API Web tong | Giu no la helper/service noi bo AI-app | Khong phai public endpoint |
| `savePendingCheckout` nhu mot API Web tong | Giu no la helper/service noi bo AI-app | Khong phai public endpoint |

## 2. Viec AI-app phai lam

- [ ] Chuan hoa toan bo luong order-status ve `GET /api/orders/:orderId`.
- [ ] Chuan hoa luong current-user ve `GET /api/auth/me`.
- [ ] Khong document cac helper bridge noi bo nhu la public API cua Web tong.
- [ ] Kiem tra toan bo source AI-app de loai bo hardcode path bridge sai.
- [ ] Sau checkout thanh cong, bat buoc re-fetch order status va snapshot user.
- [ ] Neu tich hop license desktop, goi dung `GET /api/ai-app/customers/:customerId/licenses` va `POST /api/ai-app/licenses/verify`.

## 3. Endpoint Web tong da san sang cho AI-app

- `GET /api/catalog`
- `POST /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/auth/customer/login`
- `GET /api/auth/me`
- `POST /api/auth/customer/logout`
- `POST /api/auth/customer/register/send-code`
- `POST /api/auth/customer/register`
- `POST /api/auth/customer/password-reset/send-code`
- `POST /api/auth/customer/password-reset/confirm`
- `GET /api/auth/google/config`
- `POST /api/auth/customer/google`
- `GET /api/ai-app/customers/:customerId/licenses`
- `POST /api/ai-app/licenses/verify`
- `GET /api/customer/licenses`
- `POST /api/licenses/:licenseId/activate`
- `POST /api/licenses/:licenseId/verify`
- `POST /api/licenses/:licenseId/deactivate`

## 4. Chua xong ben AI-app

- [ ] Auth UI trong app
- [ ] Session persistence
- [ ] Secure storage cho bridge token
- [ ] Device binding
- [ ] Offline grace mode
- [ ] Top-up `prod-study-topup`
- [ ] Telemetry `appVersion` va `deviceId`