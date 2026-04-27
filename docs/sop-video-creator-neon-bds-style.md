# SOP Video Creator tren Neon (Theo kieu BDS)

## Muc tieu
- Lam dung quy trinh nhu app BDS.
- Dung database Neon thay vi local Postgres.
- Giu nguyen cau truc he thong hien tai.

## A. Viec can chot truoc
1. Co DATABASE_URL Neon hoat dong.
2. Co bo cai desktop da build (Setup_VideoCreator.exe).
3. Co key kich hoat de test 1 key/1 may.

## B. Chay quy trinh DB tren Neon
1. Cap nhat DATABASE_URL trong file .env (hoac bien moi truong production).
2. Chay migration:
   npm run db:migrate
3. Neu migrate ok, tiep tuc buoc C.

## C. Publish bo update cua Video Creator
1. Dat file bo cai vao:
   public/app-updates/app-prompt-image-video/Setup_VideoCreator.exe
2. Cap nhat file:
   public/app-updates/app-prompt-image-video/version.json
3. Cap nhat release note:
   public/app-updates/app-prompt-image-video/release-notes-YYYY.MM.DD.txt
4. Tinh SHA256 cua file Setup_VideoCreator.exe va dien vao truong sha256.

## D. Test nhu BDS
1. Vao /account?tab=downloads, kiem tra app Video Creator co nut Tai app.
2. Goi /api/v1/app-updates/app-prompt-image-video/manifest de kiem tra manifest.
3. Test kich hoat key tren may A.
4. Test cung key tren may B -> phai bi chan (1 key/1 may).
5. Test update thong qua manifest (co key hop le).

## E. Co che tinh phi update rieng (khong pha cau truc)
1. Ra major moi -> tao product moi cho major do.
2. Khach chua mua major moi: thay thong bao nhung khong duoc cap update major moi.
3. Khach da mua: duoc tai major moi.

## F. Neu loi migrate tren Neon
1. Kiem tra lai DATABASE_URL co dung host Neon va sslmode=require.
2. Kiem tra IP/network policy cua Neon project.
3. Chay lai: npm run db:migrate

## G. Lenh nhanh can dung
- Migrate: npm run db:migrate
- Chay app local: npm run dev
- Kiem tra nhanh health: GET /api/health
