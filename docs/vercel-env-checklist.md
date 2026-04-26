# Vercel Env Checklist

Muc tieu file nay: copy nhanh cac bien moi truong can thiet de deployment Vercel khong bi `FUNCTION_INVOCATION_FAILED` va homepage van render duoc dung cach.

## 1. Bat buoc toi thieu

Dat trong Vercel Project Settings -> Environment Variables:

```env
NODE_ENV=production
APP_BASE_URL=https://websalestotal.vercel.app
DATABASE_URL=<postgres-connection-string>
SESSION_SIGNING_SECRET=<mot-secret-manh-toi-thieu-32-ky-tu>
WEBHOOK_SIGNATURE_SECRET=<mot-secret-rieng>
ADMIN_OWNER_KEY_LOGIN_ENABLED=false
```

Ghi chu:
- `APP_BASE_URL`: doi thanh domain that neu anh map custom domain.
- `DATABASE_URL`: neu bo trong, homepage se hien fallback demo va cac route can DB se tra `503`.
- `SESSION_SIGNING_SECRET`: khong duoc de gia tri yeu hoac gia tri demo trong production.

## 2. Nen them ngay de homepage/payment dung mode that

```env
PAYMENT_PROVIDER_MODE=sepay
SEPAY_WEBHOOK_SECRET=<sepay-secret>
SEPAY_BANK_CODE=970416
SEPAY_BANK_ACCOUNT_NUMBER=49312517
SEPAY_ACCOUNT_NAME=KHUONG VAN BINH
```

Luu y quan trong:
- `SEPAY_WEBHOOK_SECRET` phai trung khop voi token/API key dang cau hinh ben Sepay webhook.
- Neu Sepay log `401 Invalid Sepay signature`, uu tien kiem tra lai secret tren Vercel va trong man hinh webhook Sepay truoc.
- Ban va account nhan tien van phai dung: `970416 / 49312517 / KHUONG VAN BINH`.

Neu chi preview giao dien, co the dung:

```env
PAYMENT_PROVIDER_MODE=mock
```

## 3. Neu dung Google login

```env
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
```

Neu chua dat 2 bien nay, login Google se tu an hoac bao chua san sang, nhung site van chay.

## 4. Neu dung AI-app bridge

```env
AI_APP_SHARED_KEY=<shared-secret>
AI_APP_OFFLINE_GRACE_DAYS=7
```

## 5. Neu dung Gmail thong bao

```env
GMAIL_NOTIFY_ENABLED=true
GMAIL_NOTIFY_FROM=<gmail-gui-di>
GMAIL_NOTIFY_TO=<gmail-nhan-thong-bao>
GOOGLE_REFRESH_TOKEN=<refresh-token>
```

Khong co nhom nay thi site van chay, chi mat tinh nang gui mail.

## 6. Neu dung admin commit AI gate len GitHub

```env
GITHUB_TOKEN=<github-token>
GITHUB_REPO_OWNER=khuongbinhinfo-a11y
GITHUB_REPO_NAME=web_Sales_Total
GITHUB_REPO_BRANCH=main
```

## 7. Bo copy nhanh theo 2 muc dich

### Preview cho giao dien homepage tren Vercel

```env
NODE_ENV=production
APP_BASE_URL=https://websalestotal.vercel.app
DATABASE_URL=<postgres-connection-string>
SESSION_SIGNING_SECRET=<mot-secret-manh-toi-thieu-32-ky-tu>
WEBHOOK_SIGNATURE_SECRET=<mot-secret-rieng>
ADMIN_OWNER_KEY_LOGIN_ENABLED=false
PAYMENT_PROVIDER_MODE=mock
```

### Chay gan du production tren Vercel

```env
NODE_ENV=production
APP_BASE_URL=https://websalestotal.vercel.app
DATABASE_URL=<postgres-connection-string>
SESSION_SIGNING_SECRET=<mot-secret-manh-toi-thieu-32-ky-tu>
WEBHOOK_SIGNATURE_SECRET=<mot-secret-rieng>
ADMIN_OWNER_KEY_LOGIN_ENABLED=false
PAYMENT_PROVIDER_MODE=sepay
SEPAY_WEBHOOK_SECRET=<sepay-secret>
SEPAY_BANK_CODE=970416
SEPAY_BANK_ACCOUNT_NUMBER=49312517
SEPAY_ACCOUNT_NAME=KHUONG VAN BINH
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
AI_APP_SHARED_KEY=<shared-secret>
AI_APP_OFFLINE_GRACE_DAYS=7
```

## 8. Cach kiem tra sau khi set env

1. Mo `/api/health`
2. Neu tot, phai thay `ok: true` va `database: connected`
3. Mo `/api/catalog`
4. Mo homepage, notice fallback phai bien mat hoac chuyen sang trang thai live
5. Dang nhap customer va mo `/account?tab=downloads` de xac nhan luong account hoat dong