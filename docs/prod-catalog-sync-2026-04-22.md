# Production Catalog Sync - 2026-04-22

Tai lieu nay chot 2 viec:
- SQL nguon chuan de keo production ve dung catalog local hien tai.
- Checklist doi chieu local/prod sau khi deploy.

## 1. Nguon su that

- Catalog API backend doc tu DB: [src/modules/store.js](f:/web_Sales_Total/src/modules/store.js#L200)
- Route public catalog: [src/server.js](f:/web_Sales_Total/src/server.js#L677)
- Gia local canonical hien tai: [src/db/seed.js](f:/web_Sales_Total/src/db/seed.js#L19)
- Migration gia study truoc do: [migrations/005_sync_study_catalog_prices.sql](f:/web_Sales_Total/migrations/005_sync_study_catalog_prices.sql#L1)
- Migration app identity local moi: [migrations/012_sync_study_app_identity.sql](f:/web_Sales_Total/migrations/012_sync_study_app_identity.sql#L1)
- Migration dong bo production moi: [migrations/013_sync_study_catalog_with_local_source.sql](f:/web_Sales_Total/migrations/013_sync_study_catalog_with_local_source.sql)

## 2. Drift da xac nhan

Da kiem tra production qua `https://ungdungthongminh.shop/api/catalog`.

### App identity

| Hang muc | Production hien tai | Local canonical |
|---|---|---|
| `app-study-12.name` | `Hoc Tap Lop 12` | `Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học` |
| `app-study-12.slug` | `hoc-tap-lop-12` | `phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc` |
| `app-study-12.description` | `Nen tang luyen de thi THPT va AI tro giang cho hoc sinh lop 12.` | `Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc.` |

### Product drift

| Product ID | Production hien tai | Local canonical |
|---|---|---|
| `prod-test-2k` | `active=true` | `active=false` |
| `prod-study-month` | `99000` | `89000` |
| `prod-study-year` | `890000` | `599000` |
| `prod-study-premium-month` | can verify lai sau deploy | `119000` |
| `prod-study-premium-year` | can verify lai sau deploy | `899000` |
| `prod-study-standard-lifetime` | can verify lai sau deploy | `999000` |
| `prod-study-premium-lifetime` | can verify lai sau deploy | `1599000` |
| `prod-study-topup` | `149000` | `149000` |

## 3. Tai sao giao dien production hien 99k

- Frontend uu tien goi `GET /api/catalog`: [src/web/main.js](f:/web_Sales_Total/src/web/main.js#L900)
- Trang chi tiet san pham cung goi `GET /api/catalog`: [src/web/product.js](f:/web_Sales_Total/src/web/product.js#L871)
- Frontend chi roi ve `fallbackProducts` khi catalog loi.

He qua: neu production API tra `99000` thi giao dien se hien `99k` du local source da chuyen thanh `89k`.

## 4. Cach xu ly production

1. Deploy code co migration [migrations/013_sync_study_catalog_with_local_source.sql](f:/web_Sales_Total/migrations/013_sync_study_catalog_with_local_source.sql)
2. Chay migrate tren production
3. Goi lai `https://ungdungthongminh.shop/api/catalog`
4. Xac nhan frontend production hien dung gia va dung app name

## 5. Checklist sau deploy

- [ ] `GET /api/catalog` production tra `app-study-12.name = Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học`
- [ ] `GET /api/catalog` production tra `prod-study-month.price = 89000`
- [ ] `GET /api/catalog` production tra `prod-study-year.price = 599000`
- [ ] `GET /api/catalog` production khong expose `prod-test-2k` nhu san pham active
- [ ] Trang home production hien gia thang standard la `89k`
- [ ] Trang chi tiet product khong bao sai gia/khong roi vao trang thai `Chưa mở bán`
- [ ] AI-app product map van map dung `prod-study-month`, `prod-study-year`, `prod-study-premium-month`, `prod-study-premium-year`