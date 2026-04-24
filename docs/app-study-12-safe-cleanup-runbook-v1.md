# App-Study-12 Safe Cleanup Runbook v1

- Pham vi: chi ap dung cho `app-study-12`
- Muc tieu: don nhanh map/verify/pricing theo thu tu commit ma khong vo production
- Nguyen tac: thay doi nho, co gate moi commit, rollback doc lap tung commit

## 1. Pham vi giu nguyen truoc

1. Giu nguyen toan bo flow cac app khac ngoai `app-study-12`.
2. Giu nguyen cac goi da dung va dang chay on:
   - `free`
   - `standard` monthly `89k`
   - `standard` yearly `599k`
   - `standard` lifetime `1299k`
   - `premium` monthly `119k`
   - `premium` yearly `899k`
   - `premium` lifetime `1599k`
3. Chi chinh phan map/verify/pricing lien quan `app-study-12`.

## 2. Thu tu commit khuyen nghi

### Commit 01: Them co gioi han pham vi theo app-study-12

- Muc tieu: moi thay doi moi chi chay khi `appId = app-study-12`.
- Lam:
  - Them guard o cac nhanh xu ly map plan, metadata, error contract.
  - Khong duoc de thay doi roi vao flow dung chung cua app khac.
- Verify:
  - Test nhanh `app-study-12`.
  - Smoke test 1 app khac bat ky, ket qua phai khong doi.
- Rollback:
  - Revert dung commit nay la he thong ve nhu cu.

### Commit 02: Chuan hoa error contract cho verify

- Muc tieu: tra thong nhat `ok=false`, `errorCode`, `message` cho `400/401/404/409/500`.
- Lam:
  - Chi sua response shape.
  - Khong doi business logic verify hien tai.
- Verify:
  - Ban 4 case loi va check body dung schema contract.
  - Test them 1 case thanh cong de chac chan response `200` khong vo.
- Rollback:
  - Revert commit neu client cu bi anh huong.

### Commit 03: Bo sung metadata plan/product day du cho app-study-12

- Muc tieu: key cua `app-study-12` luon co `metadata.planId` hoac `metadata.productId`.
- Lam:
  - Bo sung metadata cho monthly/yearly/lifetime cua `app-study-12`.
  - Khong cham vao metadata cua app khac.
- Verify:
  - Tao key test cho tung goi cua `app-study-12`.
  - Inspect payload verify de dam bao co truong metadata uu tien.
- Rollback:
  - Revert neu phat sinh sai map plan.

### Commit 04: Don fallback thua nhung giu fallback an toan

- Muc tieu: bo cac nhanh fallback gay lech gia/map, nhung van giu safety fallback co kiem soat.
- Lam:
  - Xoa fallback doan mo.
  - Chi giu fallback explicit map theo contract da chot.
  - Neu can, dua fallback cu vao feature flag tam thoi thay vi xoa thang ngay lap tuc.
- Verify:
  - Tat 1 nguon du lieu gia lap va xac nhan he thong fail-safe ro rang.
  - Khong duoc silent-map sang sai goi.
- Rollback:
  - Bat lai fallback cu qua feature flag hoac revert commit.

### Commit 05: Dong bo source of truth gia

- Muc tieu: gia `app-study-12` lay tu Web source chuan, khong bi local override.
- Lam:
  - Khoa local override cho `app-study-12`.
  - Giu nguyen co che hien tai cho app khac neu dang dung on.
- Verify:
  - Doi chieu 6 gia chuan trong contract.
  - Thu case cache miss de xac nhan hanh vi fail-safe ro rang.
- Rollback:
  - Tam bat local read-only fallback bang env flag neu can.

### Commit 06: Lam sach code thua sau khi da pass test

- Muc tieu: xoa dead code lien quan nhanh cu khong dung nua.
- Lam:
  - Xoa nho theo tung cum.
  - Khong gop xoa lon trong 1 commit.
- Verify:
  - Full regression.
  - Smoke test production-like truoc merge.
- Rollback:
  - Cherry-pick hoan tac tung cum nho neu can.

### Commit 07: Chot tai lieu va release note

- Muc tieu: team van hanh hieu ro cai gi giu, cai gi bo, cach rollback.
- Lam:
  - Cap nhat contract.
  - Cap nhat checklist runbook.
  - Cap nhat lenh verify va release note.
- Verify:
  - Dry-run on-call theo runbook.
- Rollback:
  - Khong can rollback code, chi sua lai doc neu can.

## 3. Gate bat buoc truoc merge moi commit

1. Pass test case `app-study-12` theo contract.
2. Pass smoke test 1 app khac bat ky.
3. Co rollback note 1 dong trong PR.
4. Khong co thay doi schema pha backward compatibility neu chua co migration plan.

## 4. Nhung gi nen giu lai de tiet kiem thoi gian

1. Giu cac goi chung da dung nhu danh sach o Muc 1.
2. Giu endpoint chinh hien tai, chi chuan hoa payload/error.
3. Giu cau truc map hien tai neu da dung `productId`.
4. Chi doi khi vi pham contract hoac gay lech quyen/gia.

## 5. Checklist release nhanh cho on-call

1. Xac nhan commit dang deploy dung thu tu `01 -> 07`.
2. Xac nhan pham vi thay doi co guard `app-study-12`.
3. Chay verify toi thieu:
   - 1 case success
   - 1 case key sai
   - 1 case key revoked/het han
   - 1 case `409 DEVICE_MISMATCH`
4. Chay smoke test 1 app khac khong lien quan.
5. Ghi ro rollback command/commit can revert neu that bai.

## 6. Ghi chu van hanh

- Uu tien rollback theo commit gan nhat gay loi, khong rollback gon ca cum neu chua co bang chung.
- Neu co dau hieu drift local/prod, kiem tra lai env, source gia, va migration truoc khi ket luan loi logic.
- Khong merge buoc don dead code truoc khi contract va verify payload da on dinh.