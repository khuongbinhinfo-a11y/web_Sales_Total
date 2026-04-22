# Multi-App License Position Note

Tai lieu nay la ban rut gon de gui cho AIapp/Web tong khi can chot quan diem ve mo hinh quan ly nhieu app.

## 1. Ket luan ngan gon

De xuat can bang nhat la:

- Nguoi dung van dang nhap bang tai khoan Web tong.
- Web tong van la nguon su that cho auth, payment, order, customer profile va entitlement.
- Tuy nhien, moi app nen co them lop `app-license/key` do Web tong phat hanh va quan ly tap trung.

Noi ngan gon:

- `Account` tra loi: day la ai.
- `Entitlement` tra loi: khach da mua quyen gi.
- `App license/key` tra loi: quyen do dang duoc cap va dung nhu the nao tren tung app/thiet bi.

## 2. Vi sao chi dung account + entitlement se som bat tien

Voi he sinh thai nhieu app, chi dung account tong va goi/entitlement chung se som gap 4 van de:

### A. Kho tach quyen theo tung app

Mot customer co the mua nhieu app va add-on khac nhau. Neu chi nhin entitlement tong, app desktop/webapp kho xac dinh ro:

- quyen nao thuoc app nao
- goi nao dang kich hoat
- quyen nao da phat hanh de dung thuc te

### B. Desktop app can don vi kich hoat ro rang

Desktop can xu ly cac nghiep vu ma account/session khong giai quyet dep:

- doi may
- cai lai may
- mat mang tam thoi
- offline grace mode
- support thu hoi/kich hoat lai

Muons vay can mot don vi dai dien cho license da phat hanh va da kich hoat. `app-license/key` la don vi hop ly.

### C. Kho support va doi soat

CSKH ve sau thuong can tra loi rat nhanh:

- don hang nao cap quyen gi
- license nao dang active
- license nao dang bind o may nao
- license nao het han, bi khoa hoac refund

Neu khong co lop license/key tach bach, viec support se roi va kho tra cuu khi so app tang len.

### D. Kho mo rong cho bundle, gift, reseller, corporate

Ve sau rat de phat sinh nhu cau:

- 1 don hang cap nhieu app-license
- 1 goi nhieu seat
- reseller/gift key
- trial, grace, reactivate, replace device

Mo hinh chi co entitlement van lam duoc, nhung se ngay cang phuc tap va thieu ro rang.

## 3. Nhung cung khong nen quay lai mo hinh key roi rac

Khong nen de moi app tu quan ly key rieng ngoai he thong vi se gay:

- lech du lieu giua Web tong va app
- kho revoke/refund/tam khoa dong bo
- kho audit va support
- kho mo rong khi co nhieu app

Key/license neu co thi van phai thuoc Web tong, khong thuoc rieng tung app.

## 4. Mo hinh nen chot

De xuat mo hinh 3 lop:

### 1. Account

- danh tinh trung tam
- login, profile, lich su mua hang

### 2. Entitlement

- quyen business cap cao
- customer da mua app nao, plan nao, billing cycle nao, thoi han nao
- day la business source of truth

### 3. App license / key

- don vi kich hoat de app su dung
- duoc phat hanh tu order/entitlement
- co the active, suspended, expired, revoked
- co the bind device, verify dinh ky, support offline grace mode

## 5. De xuat chot voi AIapp/Web tong

Thong diep nen chot la:

"Ben app dong y de Web tong la nguon su that cho auth, payment, order va entitlement. Tuy nhien, voi he sinh thai nhieu app, de nghi Web tong bo sung them lop app-license/key theo tung app. Nhu vay van giu duoc centralization, nhung de hon cho desktop activation, device binding, offline grace mode, support tra cuu va mo rong sau nay."

## 6. Khuyen nghi thuc te

Neu hien tai muon di nhanh, co the chia 2 phase:

### Phase 1

- giu nguyen auth + order + entitlement nhu hien tai
- them bang `licenses` noi bo tren Web tong
- moi order thanh cong phat hanh 1 hoac nhieu license

### Phase 2

- mo API license theo `appId`
- ho tro activate / verify / deactivate
- them device binding, expiresAt, lastVerifiedAt, offline grace mode

## 7. Ket luan

Voi he sinh thai nhieu app, dac biet neu co desktop app, chi dung `account + entitlement` la chua du cho van hanh dai han.

Phuong an hop ly nhat la:

- login bang tai khoan Web tong
- van giu Web tong la trung tam
- bo sung lop `app-license/key` theo tung app do Web tong quan ly tap trung

Day la phuong an can bang giua centralization, van hanh, support va kha nang mo rong.