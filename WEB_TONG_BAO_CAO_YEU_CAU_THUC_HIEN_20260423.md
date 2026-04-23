# BAO CAO BAN GIAO CHINH THUC CHO WEB TONG (2026-04-23)

## 1) Muc tieu tich hop chung
- Dong bo chinh xac giua AI-app va Web Tong cho app dau tien: `app-study-12`.
- Dam bao contract API giu on dinh de AI-app co the verify license an toan, khong vo flow dang nhap va kich hoat.
- Dong bo product map, pricing, key va quy tac cap quyen theo cung nguon su that.

## 2) Nhung gi AI-app da hoan thanh
- Da chot mo hinh tier su dung: `free`, `standard`, `premium`.
- Da dung flow verify license theo header key va profile key.
- Da san sang su dung 2 endpoint backend cua Web Tong:
  - `GET /api/ai-app/customers/:customerId/licenses`
  - `POST /api/ai-app/licenses/verify`
- Da biet cach gui key:
  - header bat buoc: `x-ai-app-key`
  - header tuy chon profile: `x-ai-app-profile`

## 3) Nhung gi Web Tong bat buoc phai bam theo
- Khong doi ten endpoint dang tich hop.
- Khong doi ten field co ban trong payload verify/list license.
- Khong doi quy tac auth header key.
- Khong dua lai Basic vao pricing/activation integration hien tai.
- Khong doi productId dang map cho Standard/Premium neu chua co changelog da thong nhat.

## 4) Scope goi hien tai (bat buoc)
- Tier duoc phep: `free`, `standard`, `premium`.
- Loai `basic` khoi luong thanh toan/activation (de null map).
- Van co the hien thi free/basic o UI noi bo, nhung khong duoc tham gia flow ban hang tich hop hien tai.

## 5) Product map chuan (app dau tien)
Nguon map: `docs/ai-app-handoff/WEB_TOTAL_PRODUCT_MAP_JSON.json`

- App: `app-study-12`
- `standard.monthly` -> `prod-study-month`
- `standard.yearly` -> `prod-study-year`
- `standard.lifetime` -> `prod-study-standard-lifetime`
- `premium.monthly` -> `prod-study-premium-month`
- `premium.yearly` -> `prod-study-premium-year`
- `premium.lifetime` -> `prod-study-premium-lifetime`
- `basic/free` -> `null` cho monthly/yearly/lifetime trong map hien tai

## 6) Gia goc chuan Web Tong phai giu
Tham chieu catalog hien tai:
- `prod-study-month`: 89,000 VND
- `prod-study-year`: 599,000 VND
- `prod-study-standard-lifetime`: 999,000 VND
- `prod-study-premium-month`: 119,000 VND
- `prod-study-premium-year`: 899,000 VND
- `prod-study-premium-lifetime`: 1,599,000 VND
- `prod-study-topup`: 149,000 VND (top-up, ngoai scope tier)

## 7) Contract verify license phai giu on dinh
### 7.1 List licenses
- `GET /api/ai-app/customers/:customerId/licenses?appId=app-study-12`
- Header:
  - `x-ai-app-key: <shared_or_profile_key>`
  - `x-ai-app-profile: web|desktop|shared` (tuy chon)

### 7.2 Verify by license key
- `POST /api/ai-app/licenses/verify`
- Header:
  - `x-ai-app-key: <shared_or_profile_key>`
  - `x-ai-app-profile: web|desktop|shared` (tuy chon)
- Body toi thieu:
  - `appId`
  - `licenseKey`
- Body khuyen nghi them:
  - `customerId`
  - `deviceId`
  - `deviceName`

## 8) Quy tac login va key
- Admin Web Tong tao/luu key truc tiep tren admin panel.
- Khuyen nghi 1 app co 2 client (web + desktop) thi dung 2 key rieng:
  - profile `web`
  - profile `desktop`
- `shared` dung lam fallback khi can rollback/chuyen doi.
- Moi thay doi key phai thong bao doi AI-app ngay va co thoi diem cutover ro rang.

## 9) Danh sach endpoint Web Tong AI-app dang phu thuoc
- `GET /api/ai-app/customers/:customerId/licenses`
- `POST /api/ai-app/licenses/verify`
- (Quan tri/noi bo key) `GET/POST /api/admin/integrations/ai-app`
- (Reveal key noi bo) `POST /api/admin/integrations/ai-app/reveal`

## 10) Checklist thuc hien cho app dau tien (app-study-12)
- [ ] Chot key profile `web` va gui cho AI-app.
- [ ] Chot key profile `desktop` va gui cho AI-app.
- [ ] Verify map product theo dung file map chuan.
- [ ] Verify gia goc catalog dung nhu muc 6.
- [ ] Test `GET /api/ai-app/customers/:customerId/licenses` voi 1 customer that.
- [ ] Test `POST /api/ai-app/licenses/verify` voi 1 licenseKey that.
- [ ] Test sai key -> phai ra 401.
- [ ] Test license het han/revoked -> phai ra 404 hop le.
- [ ] Chot bien ban nghiem thu giua 2 ben.

## 11) Tieu chi nghiem thu giua hai ben
- API tra dung schema nhu da thong nhat.
- Key auth hoat dong on dinh cho ca web va desktop.
- Product map + pricing khong lech voi tai lieu chuan.
- 2 bai test thuc te thanh cong:
  - verify license hop le
  - verify license khong hop le
- Khong co regression tren login/admin flow sau khi go-live.

## 12) Ke hoach lam thu app dau tien (de xuat thuc thi nhanh)
Ngay 1:
- Chot key profile web/desktop.
- Chay test API truc tiep bang Postman.

Ngay 2:
- Noi AI-app vao endpoint production.
- Chay smoke test 10 tai khoan thuc te.

Ngay 3:
- Chot nghiem thu, dong bo van ban va khoi tao app tiep theo.
