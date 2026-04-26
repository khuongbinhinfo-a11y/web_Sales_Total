# Toi uu giao dien khach hang va thay the portal cu

Ngay cap nhat: 2026-04-26

## 1. Muc tieu

- Bo tri lai giao dien khach hang de giam cam giac so sai, cung va thieu chuyen nghiep.
- Khong dung portal cu nua.
- Sau khi mua xong, khach chi thay nut tai app trong khu vuc tai khoan da dang nhap.
- Khong hien link tai app tra phi cong khai tren trang san pham.
- Giu nguyen 2 ngoai le co site rieng:
  - Phan mem on tap cho khoi cap 01 va Tien Tieu hoc
  - cac app/website da co diem tai rieng duoc chi dinh ro trong catalog

## 2. Danh gia hien trang

### 2.1 Giao dien khach hien tai

Nguon chinh dang dung:

- Header storefront o [src/web/index.html](../src/web/index.html#L23)
- Auth state va drawer san pham da mua o [src/web/main.js](../src/web/main.js#L688)
- Drawer san pham da mua o [src/web/index.html](../src/web/index.html#L488)
- Logic render drawer o [src/web/main.js](../src/web/main.js#L1042)
- CSS drawer o [src/web/styles.css](../src/web/styles.css#L618)

Van de UX hien tai:

- Header dang tron lan dieu huong noi dung, auth, quan ly tai khoan va admin trong cung mot hang.
- Muc `San pham da mua` bi lap lai o ca menu chinh va dropdown user.
- Sau khi dang nhap thanh cong, khach khong co mot trang tai khoan dung nghia, chi co drawer ben phai.
- Drawer chi hien 3 nhom du lieu thong, khong co tong quan, khong co card app, khong co CTA tai app.
- Mobile menu chi la toggle mo dong, khong co nhom dieu huong theo tac vu.
- Trang chi tiet san pham van dang co CTA tai app/public-contact o [src/web/product.js](../src/web/product.js#L572) va [src/web/product.js](../src/web/product.js#L1354).

### 2.2 Portal cu

Portal frontend cu van ton tai o:

- [src/web/portal.html](../src/web/portal.html)
- [src/web/portal.js](../src/web/portal.js)
- CSS portal o [src/web/styles.css](../src/web/styles.css#L450)

Nhung route portal da khong con la luong dung that:

- `/portal/login` redirect ve `/` o [src/server.js](../src/server.js#L2558)
- `/portal` redirect ve `/` o [src/server.js](../src/server.js#L3326)
- `/portal.html` redirect ve `/` o [src/server.js](../src/server.js#L3335)

Ket luan:

- Portal cu da bi bo o tang giao dien, nhung van con dau vet auth/API trong backend.
- Can tach ro phan nao co the xoa ngay, phan nao phai doi middleware truoc khi xoa.

## 3. Checklist xoa portal cu an toan

## 3.1 Nhom A: Co the bo ngay

Nhung thanh phan nay hien khong nam trong luong dung that va co the xoa an toan sau khi da co man hinh thay the cho khach hang:

1. Frontend portal cu
   - [src/web/portal.html](../src/web/portal.html)
   - [src/web/portal.js](../src/web/portal.js)

2. CSS portal rieng
   - [src/web/styles.css](../src/web/styles.css#L450)
   - cac class `.portal-grid`, `.portal-sidebar`, `.portal-main`

3. Redirect giao dien portal khong can thiet
   - [src/server.js](../src/server.js#L2558)
   - [src/server.js](../src/server.js#L3326)
   - [src/server.js](../src/server.js#L3335)

4. Backup portal frontend neu khong con gia tri luu tru tay
   - `backups/portal.html.bak`
   - `backups/portal.js.bak` neu co

Dieu kien truoc khi xoa:

- Da co trang `Tai khoan cua toi` hoac `San pham da mua` moi.
- Menu storefront da tro ve mot diem truy cap duy nhat cho khach da dang nhap.

## 3.2 Nhom B: Khong xoa ngay, phai doi middleware truoc

Nhung thanh phan sau dang gan voi API con song, neu xoa ngay se gay vo luong license self-service:

1. Middleware va auth portal cu trong backend
   - [src/modules/auth.js](../src/modules/auth.js#L528)
   - [src/modules/auth.js](../src/modules/auth.js#L567)
   - [src/modules/auth.js](../src/modules/auth.js#L585)
   - [src/modules/auth.js](../src/modules/auth.js#L619)
   - export o [src/modules/auth.js](../src/modules/auth.js#L906)

2. Bien moi truong cu
   - [src/config/env.js](../src/config/env.js#L173)

3. Route/API duoc goi bang middleware cu
   - [src/server.js](../src/server.js#L1125)
   - [src/server.js](../src/server.js#L1144)
   - [src/server.js](../src/server.js#L1168)
   - [src/server.js](../src/server.js#L1211)
   - [src/server.js](../src/server.js#L1254)
   - [src/server.js](../src/server.js#L2748)
   - [src/server.js](../src/server.js#L3041)

Ly do:

- Ten middleware van la `requirePortalOrAdmin`, nhung thuc te no dang bao ve nhom API self-service cho khach/admin.
- Neu xoa ngay se mat duong activate, verify, deactivate license qua human flow.

## 3.3 Nhom C: Tai lieu can cap nhat sau refactor

Can cap nhat sau khi doi xong middleware va route:

1. README va docs tong quan
   - [README.md](../README.md#L127)
   - [docs/platform-standard-v1.md](../docs/platform-standard-v1.md#L89)
   - [docs/api-changelog.md](../docs/api-changelog.md#L172)
   - [docs/vercel-env-checklist.md](../docs/vercel-env-checklist.md#L15)

2. OpenAPI va Postman
   - [docs/openapi/openapi-v1.yaml](../docs/openapi/openapi-v1.yaml#L550)
   - [docs/openapi/postman-v1.collection.json](../docs/openapi/postman-v1.collection.json)
   - [docs/ai-app-handoff/openapi/openapi-v1.yaml](../docs/ai-app-handoff/openapi/openapi-v1.yaml#L550)
   - [docs/ai-app-handoff/openapi/postman-v1.collection.json](../docs/ai-app-handoff/openapi/postman-v1.collection.json)

3. Handoff docs dang nhac den portal
   - [docs/ai-app-handoff/README.project.md](../docs/ai-app-handoff/README.project.md#L83)
   - [docs/ai-app-handoff/app-license-minimum-schema-api.md](../docs/ai-app-handoff/app-license-minimum-schema-api.md#L131)
   - [docs/ai-app-handoff/ai-app-connect-commands.md](../docs/ai-app-handoff/ai-app-connect-commands.md#L45)

## 3.4 Thu tu cleanup khuyen nghi

### Pha 1: Doi ten luong auth

1. Tao middleware moi `requireCustomerOrAdmin`.
2. Doi cac API dang dung `requirePortalOrAdmin` sang middleware moi.
3. Bo cookie `wst_portal_session` khoi luong chay chinh.

### Pha 2: Doi luong frontend khach hang

1. Tao trang `Tai khoan cua toi` moi.
2. Doi CTA `San pham da mua` trong header sang trang moi.
3. Drawer chi giu vai tro preview nhanh hoac bo han tuy quyet dinh UX.

### Pha 3: Xoa dau vet portal

1. Xoa `portal.html`, `portal.js`, CSS portal.
2. Xoa route `/portal`, `/portal/login`, `/auth/portal/login`.
3. Xoa `portalAccessKey` khoi env va docs.

## 4. Thiet ke giao dien thay the cho khach hang

## 4.1 Nguyen tac UX

- Khach phai hieu ro 3 viec chinh sau dang nhap:
  - da mua gi
  - da nhan key gi
  - duoc tai app nao ngay bay gio
- Khong hien CTA tai app tra phi o catalog cong khai.
- Muc quan trong nhat sau mua la `Tai app cua toi`, khong phai `Don hang`.
- Menu phai tach ro dieu huong san pham va dieu huong tai khoan.

## 4.2 Dieu huong moi tren storefront

### Khi chua dang nhap

Header de xuat:

1. `San pham`
2. `Thiet ke Web`
3. `Huong dan mua`
4. `Dang nhap`
5. `Dang ky`

Khong hien:

- `San pham da mua`
- dropdown user

### Khi da dang nhap

Header de xuat:

1. `San pham`
2. `Thiet ke Web`
3. `Tai khoan cua toi`
4. nut avatar/email

Dropdown user:

1. `Tai khoan cua toi`
2. `Key cua toi`
3. `Don hang`
4. `Dang xuat`

Loai bo lap menu hien tai:

- Khong giu dong thoi `navMyProducts` tren thanh ngang va `dropMyProducts` trong dropdown nhu [src/web/index.html](../src/web/index.html#L26) va [src/web/index.html](../src/web/index.html#L32).

## 4.3 Trang moi: Tai khoan cua toi

De xuat them mot trang moi, vi du:

- `/account`

Trang nay la diem vao duy nhat cho luong sau mua.

### Cau truc man hinh

#### Khoi 1: Account hero

Noi dung:

- Ten khach hang
- Email
- Trang thai tai khoan
- So app da mua
- Key moi nhat vua cap
- CTA chinh: `Tai app cua toi`

#### Khoi 2: Thanh tab theo tac vu

Thu tu uu tien:

1. `Tai app cua toi`
2. `Key cua toi`
3. `Goi dang dung`
4. `Don hang`
5. `Ho tro`

#### Khoi 3: Danh sach app da mua

Moi app la mot card rieng, khong dung bang phang.

Moi card hien:

- Anh icon app
- Ten app
- Product/goi da mua
- Trang thai
  - da mua
  - da cap key
  - chua kich hoat
  - da kich hoat
  - lifetime/het han
- Hanh dong chinh
  - `Tai app`
  - hoac `Mo site rieng` voi ngoai le
- Hanh dong phu
  - `Copy key`
  - `Huong dan cai`
  - `Lien he ho tro`

## 4.4 Quy tac hien nut tai app

Nut tai app chi hien khi dong thoi dung cac dieu kien sau:

1. user da dang nhap
2. order da `paid`
3. co license hoac key hop le cho app do
4. app thuoc nhom duoc tai qua Web Tong

Khong hien nut tai khi:

- don `pending`
- app chua duoc cap key
- app thuoc nhom site rieng
- order thuoc san pham chi lien he/tu van

Xu ly ngoai le:

1. `app-study-12`
   - hien nut `Mo website hoc tap`
   - khong hien `Tai app`

2. `app-bds-website-manager`, `hair-spa-manager`, `app-prompt-image-video` va cac app desktop tra phi khac
   - hien `Tai app` chi trong trang tai khoan

## 4.5 Luong sau khi mua xong

### Luong mong muon

1. Khach tao don va thanh toan.
2. He thong cap key/ license nhu hien tai.
3. Redirect ve web voi tham so thanh cong.
4. Neu khach da dang nhap:
   - dua thang vao `/account?tab=downloads&highlight=<appId>`
5. Neu khach chua dang nhap:
   - mo modal dang nhap/dang ky
   - sau khi auth xong thi dua vao `/account?tab=downloads&highlight=<appId>`
6. Trang account scroll den card app vua mua.
7. Card app vua mua duoc nhan manh va hien CTA tai phan mem.

### Hanh vi thay the cho logic hien tai

Logic hien tai:

- sau thanh toan thanh cong thi auto-mo drawer o [src/web/main.js](../src/web/main.js#L1364)

Can doi thanh:

- neu `myproducts=1` thi khong mo drawer nua
- chuyen huong sang `/account?tab=downloads`

## 4.6 Luong tai app sau mua

### Hanh vi frontend

1. User vao `Tai khoan cua toi`.
2. Tab mac dinh neu vua thanh toan xong la `Tai app cua toi`.
3. User bam `Tai app`.
4. Frontend goi API xin `download ticket` hoac signed URL.
5. Neu du dieu kien thi backend tra ve URL tam thoi.
6. Frontend redirect tai file.

### Hanh vi backend

Backend kiem tra:

1. session customer hop le
2. customer so huu order paid hoac license hop le cho app
3. app nam trong nhom cho phep tai qua Web Tong
4. neu hop le thi tra signed URL co han ngan

Khong tra file cong khai truc tiep tu product page.

## 4.7 Du lieu can co cho trang account moi

Snapshot hien co o [src/modules/store.js](../src/modules/store.js#L1665) da co:

- `customer`
- `orders`
- `subscriptions`
- `keyDeliveries`
- `licenses`

Can them view-model phuc vu UI, de frontend khong phai tu ghep qua nhieu mang roi:

```json
{
  "downloadableApps": [
    {
      "appId": "hair-spa-manager",
      "appName": "Salon Manager",
      "productId": "prod-salon-manager-lifetime",
      "orderStatus": "paid",
      "licenseStatus": "active",
      "licenseKey": "SM-XXXX-XXXX",
      "deliveryType": "desktop_download",
      "downloadVisible": true,
      "downloadAction": {
        "type": "signed_url",
        "endpoint": "/api/account/downloads/hair-spa-manager"
      },
      "supportAction": {
        "type": "zalo",
        "href": "https://zalo.me/..."
      }
    }
  ]
}
```

## 4.8 API de xuat

### API doc tai khoan

Them endpoint moi:

- `GET /api/account/overview`

Tra ve:

- customer summary
- purchased apps summary
- downloadableApps
- latest key deliveries
- support links

### API xin link tai

Them endpoint moi:

- `POST /api/account/downloads/:appId`

Backend se:

1. doc session customer
2. kiem tra order paid/license
3. kiem tra app co duoc tai qua Web Tong khong
4. sinh signed URL hoac download ticket ngan han
5. ghi log download

Response de xuat:

```json
{
  "ok": true,
  "downloadUrl": "https://download.example.com/...signed...",
  "expiresInSeconds": 300,
  "fileName": "SalonManagerSetup-1.0.0.exe"
}
```

## 4.9 Quy tac cho trang chi tiet san pham

Trang chi tiet san pham o [src/web/product.js](../src/web/product.js#L572) can doi logic:

### Hien tai

- co the tra `Tai app`
- hoac `Lien he nhan app`

### Can doi

1. neu la app tra phi desktop
   - hien CTA `Dang nhap de xem tai app sau mua`
   - hoac `Mua ngay`
2. neu la app ngoai le co site rieng
   - giu `Mo website`
3. khong bao gio phat link tai that tai day

## 5. Checklist trien khai ky thuat

## 5.1 Frontend

1. Tao trang `account.html` va `account.js`
2. Tao route `/account`
3. Doi `navMyProducts` thanh `Tai khoan cua toi`
4. Doi dropdown user cho gon, bo trung lap
5. Chuyen auto-open sau thanh toan tu drawer sang `/account?tab=downloads`
6. Giam vai tro drawer hoac bo drawer sau khi trang account on dinh
7. Cap nhat CSS header/mobile menu cho dieu huong tai khoan ro hon

## 5.2 Backend

1. Tao `requireCustomerOrAdmin`
2. Doi cac route license self-service sang middleware moi
3. Tao `GET /api/account/overview`
4. Tao `POST /api/account/downloads/:appId`
5. Them co che log tai file
6. Xoa dan route portal cu

## 5.3 Cleanup docs

1. Doi cac tai lieu nhac `portal` thanh `customer account` hoac `account area`
2. Bo `PORTAL_ACCESS_KEY` khoi env checklist sau khi middleware portal bi xoa han
3. Cap nhat OpenAPI cho nhom endpoint moi

## 6. Quyet dinh UX cuoi cung

### Nen giu gi

- Dang nhap customer bang session hien tai
- Snapshot customer hien tai
- Tu dong mo khu sau mua khi redirect tu thanh toan

### Nen bo

- Portal frontend cu
- CTA `Tai app` cong khai tren trang chi tiet san pham tra phi
- Tu duy drawer la man hinh chinh sau mua
- Menu lap lai giua header va dropdown

### Nen thay the bang gi

- Mot trang `Tai khoan cua toi` chuyen nghiep, co tabs va app cards
- Luong `sau mua -> dang nhap -> Tai app cua toi`
- Nut tai chi xuat hien trong trang tai khoan sau khi backend xac nhan entitlement
