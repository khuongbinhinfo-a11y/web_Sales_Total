# WEB TONG — UPDATE CHINH THUC GUI DEV (2026-04-23)

> Tat ca thay doi duoi day da duoc deploy len production: https://www.ungdungthongminh.shop

---

## A) ENDPOINT MOI: Dang nhap khach hang tu AI-app

**POST** `/api/ai-app/customer/auth`

Auth: `x-ai-app-key` (bat buoc, giong nhu cac endpoint ai-app hien co)

Request body:
```json
{
  "email": "user@example.com",
  "password": "matkhau",
  "appId": "app-study-12"
}
```

### Response — THANH CONG (200)
```json
{
  "ok": true,
  "customer": {
    "id": "cus_xxx",
    "email": "user@example.com",
    "fullName": "Nguyen Van A"
  },
  "licenses": [
    {
      "licenseKey": "KEY-ABCD-1234",
      "appId": "app-study-12",
      "tier": "standard",
      "period": "month",
      "status": "active",
      "expiresAt": "2026-05-23T00:00:00.000Z"
    }
  ]
}
```

### Response — LOI

| Case | HTTP | Body |
|------|------|------|
| Khong co x-ai-app-key | 401 | `{ "message": "Unauthorized" }` |
| Key sai | 401 | `{ "message": "Unauthorized" }` |
| Email sai dinh dang | 400 | `{ "message": "Email khong hop le" }` |
| Password < 8 ky tu | 400 | `{ "message": "Mat khau toi thieu 8 ky tu" }` |
| Email khong tim thay | 401 | `{ "ok": false, "message": "Email hoac mat khau khong dung" }` |
| **Tai khoan Google (chua co mat khau)** | 401 | `{ "ok": false, "needsPassword": true, "message": "Tai khoan nay dang nhap bang Google. Vui long vao ungdungthongminh.shop → dung \"Quen mat khau\" de dat mat khau truoc khi dang nhap vao app." }` |
| Mat khau sai | 401 | `{ "ok": false, "message": "Email hoac mat khau khong dung" }` |

### Xu ly `needsPassword: true` phia AI-app (yeu cau)
Khi nhan duoc field `needsPassword: true` trong response 401, app can:
1. Hien thi message huong dan (khong bao "sai mat khau").
2. Hien nut/link mo trang web: `https://www.ungdungthongminh.shop` de khach tu reset mat khau.
3. Sau khi khach dat mat khau xong, ho co the quay lai app login binh thuong bang email+password.

Luong reset mat khau tren web da co san:
- Vao trang chu → click "Quen mat khau?"
- Nhap email (he thong gui OTP qua email)
- Nhap OTP → nhap mat khau moi → xong
- Flow nay hoat dong ca voi tai khoan tao qua Google OAuth (khong can mat khau cu)

---

## B) THAY DOI HIEN CO: Trang san pham — note Free tier

**File:** `src/web/product.js` — ham `updateBuyBtn()`

Khi nguoi dung chon goi Free tren trang san pham co plan blueprint (app), note text da duoc cap nhat thanh:

> *"Dang nhap vao app bang tai khoan web la dung duoc goi Free. Muon Standard/Premium, hay mua goi roi nhap ma kich hoat trong app."*

(San pham khong co blueprint — phan mem ban le binh thuong — giu nguyen note cu)

---

## C) DANH SACH ENDPOINT AI-APP HIEN CO (cho app-study-12)

| Endpoint | Mo ta |
|----------|-------|
| `GET /api/ai-app/customers/:customerId/licenses` | Lay danh sach license cua customer |
| `POST /api/ai-app/licenses/verify` | Verify license key + ghi nhan device |
| `POST /api/ai-app/customer/auth` | (**MOI**) Dang nhap customer bang email+password |

Tat ca 3 endpoint deu yeu cau header: `x-ai-app-key`

---

## D) VIEC CAN PHOI HOP THEM

- [ ] Dev AI-app can xu ly field `needsPassword: true` trong response 401 cua `/api/ai-app/customer/auth`
- [ ] Dev AI-app test flow end-to-end voi 1 tai khoan Google:
  1. Goi `/api/ai-app/customer/auth` → ky vong `needsPassword: true`
  2. Khach vao web reset mat khau
  3. Goi lai `/api/ai-app/customer/auth` → ky vong `ok: true`
- [ ] E2E test giao dich that (Sepay): mua Standard/Premium → nhan key → verify trong app
- [ ] Chot bien ban nghiem thu lap 1 sau khi test xong

---

## E) KHONG THAY DOI (giu nguyen)

- Ten va schema cac endpoint hien co
- Auth header `x-ai-app-key` / `x-ai-app-profile`
- Product map (`app-study-12`): standard/premium → prod-study-*
- Bang gia catalog
- Flow login/admin web
