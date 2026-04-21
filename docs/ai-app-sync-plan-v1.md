# AI App Sync Execution Plan v1

Tai lieu nay la playbook de tat ca AI agent cua cac app bám theo cung mot chuan, tranh lech flow auth/payment/license.

## 1. Muc tieu
- Moi app moi phai dong bo voi web tong theo OpenAPI va Postman chuan.
- Khong app nao duoc release neu chua pass gate contract va gate integration.
- Dam bao thay doi o backend duoc lan truyen an toan sang toan bo app.

## 2. Vai tro va trach nhiem
- Platform AI (trung tam):
  - Quan ly OpenAPI, Postman collection, changelog, checklist.
  - Merge thay doi contract va duy tri CI strict parity.
- App AI (desktop/webapp/admin/mobile):
  - Chi duoc code theo contract da publish.
  - Cap nhat env va test case theo release contract moi nhat.
- Human owner:
  - Duyet breaking changes.
  - Quyet dinh rollout/rollback.

## 3. Nguon su that duy nhat (single source of truth)
- Contract: docs/openapi/openapi-v1.yaml
- Collection: docs/openapi/postman-v1.collection.json
- Environments:
  - docs/openapi/environments/local.postman_environment.json
  - docs/openapi/environments/staging.postman_environment.json
  - docs/openapi/environments/prod.postman_environment.json
- Rule check: scripts/validate-api-contracts.mjs
- CI gate: .github/workflows/api-contract.yml

## 4. Quy trinh cho moi app moi

### Phase A - Kickoff (Day 0)
- Tao ticket tu template:
  - docs/templates/app-onboarding-ticket-template.md
- Gan owner va sprint cho app.
- Chot appId/productId duoc phep su dung.

### Phase B - Contract lock (Day 1)
- App AI import OpenAPI + Postman collection + environment.
- Tu dong generate API client/types tu OpenAPI.
- Mapping endpoint vao man hinh app.

### Phase C - Implementation (Day 2-4)
- Implement bat buoc:
  - Auth flow
  - Catalog + order + checkout redirect
  - Snapshot/entitlement sync
  - Trang thai expired/suspended
- Desktop bo sung:
  - device binding
  - offline grace policy

### Phase D - Verification (Day 4-5)
- Chay smoke test theo Postman collection.
- Chay integration checklist:
  - docs/integration-checklist.md
- Xac nhan pass gate CI contract.

### Phase E - Release gate
- Pass full checklist critical.
- Pass api:check va workflow CI.
- Co rollback plan trong ticket.

## 5. Gate bat buoc trong pipeline
- Gate 1: Contract parity
  - npm run api:check phai pass 100% parity.
- Gate 2: Integration readiness
  - App phai pass checklist critical.
- Gate 3: Changelog discipline
  - Moi thay doi API bat buoc cap nhat docs/api-changelog.md.

## 6. Rule cho cac AI agent cua app
- Rule 1: Khong goi endpoint ngoai OpenAPI.
- Rule 2: Neu can endpoint moi, tao de xuat contract truoc khi code.
- Rule 3: Moi thay doi payload/response phai co changelog.
- Rule 4: Khong hardcode secret/env.
- Rule 5: Luon test lai 3 luong: login -> order -> entitlement refresh.

## 7. Ke hoach dong bo khi co thay doi contract
- v1.x (non-breaking):
  - Platform AI update OpenAPI + Postman + changelog.
  - App AI cap nhat trong sprint tiep theo.
- v2 (breaking):
  - Tao branch migration + migration guide.
  - Chay song song v1 va v2 den khi app chuyen xong.

## 8. Weekly operating cadence
- Thu 2: Review changelog + chot contract tuan.
- Thu 3-4: App AI implement.
- Thu 5: Integration test chung.
- Thu 6: Release hoac rollback.

## 9. KPI de do muc do dong bo
- Contract parity pass rate = 100%.
- Ti le app pass checklist critical truoc release = 100%.
- Thoi gian dong bo app sau khi contract update <= 5 ngay lam viec.
- So incident do lech contract = 0.

## 10. Checklist handoff cho moi AI app
- [ ] Da import OpenAPI va Postman collection moi nhat.
- [ ] Da chon dung environment local/staging/prod.
- [ ] Da pass smoke test endpoint trong yeu.
- [ ] Da pass integration checklist critical.
- [ ] Da cap nhat ticket + bang chung test.
