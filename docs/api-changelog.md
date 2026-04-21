# API Changelog

Tai lieu theo doi thay doi API dung cho nhieu app.
Muc tieu: khong de app nao bi vo tich hop khi backend thay doi.

## Quy uoc
- Versioning: v1 (hien tai), v1.x (mo rong khong breaking), v2 (breaking).
- Muc do thay doi:
  - Added: them endpoint/field moi (backward-compatible)
  - Changed: doi hanh vi hoac validation
  - Deprecated: danh dau se bo
  - Removed: da xoa
  - Fixed: sua loi khong doi contract
- Moi muc phai co:
  - Ngay
  - Nguoi phu trach
  - Anh huong den app nao
  - Hanh dong can lam

## 2026-04-21 | v1.1.0 | Enriched schema + Postman collection
Owner: platform-core
Impact: all

### Added
- Them Postman collection de import test nhanh:
  - docs/openapi/postman-v1.collection.json

### Changed
- Nang cap OpenAPI contract len 1.1.0:
  - docs/openapi/openapi-v1.yaml
- Bo sung schema chi tiet cho endpoint trong yeu:
  - Order: CreateOrderResponse, OrderDetailsResponse, Order, Product
  - Snapshot/Entitlement: CustomerSnapshotResponse, Entitlement, Wallet, LedgerItem
  - Dashboard KPI: AdminDashboardResponse, DashboardKpi va cac item schema lien quan
- Cap nhat response schema cho cac endpoint:
  - GET /api/auth/me
  - GET /api/portal/:customerId
  - GET /api/customers/:customerId/snapshot
  - GET /api/admin/dashboard

### Deprecated
- Chua co.

### Removed
- Chua co.

### Fixed
- Giam mo ho trong tich hop da app nhờ model hoa response payload.

### Action required
- Cac doi app update SDK/types tu OpenAPI v1.1.0.
- Import Postman collection moi va chay lai smoke test integration.

## 2026-04-21 | v1.2.0 | Postman environments + API contract CI
Owner: platform-core
Impact: all

## 2026-04-21 | v1.3.0 | Strict full parity + AI sync execution plan
Owner: platform-core
Impact: all

## 2026-04-21 | v1.4.0 | Machine-readable Definition Ready/Done gate
Owner: platform-core
Impact: all

### Added
- Them checklist YAML de AI agent doc may va quyet dinh gate:
  - docs/ai-gates/definition-ready-done.yaml
- Them script gate:
  - scripts/validate-ready-done.mjs
  - package script: npm run ai:gate
- Them workflow CI chong merge khi chua dat gate:
  - .github/workflows/ai-readiness-gate.yml

### Changed
- README bo sung huong dan su dung Definition of Ready/Done gate.

### Deprecated
- Chua co.

### Removed
- Chua co.

### Fixed
- Tu dong chan merge khi checklist required chua dat.

### Action required
- Moi PR lien quan app readiness phai cap nhat docs/ai-gates/definition-ready-done.yaml.
- Bat buoc pass npm run ai:gate truoc merge.

### Added
- Playbook dong bo cho AI cac app:
  - docs/ai-app-sync-plan-v1.md

### Changed
- Nang Postman collection len full parity 34/34 endpoint theo OpenAPI.
- Script validate contract chuyen sang strict parity:
  - fail neu Postman thieu bat ky endpoint nao co trong OpenAPI.
  - fail neu Postman co endpoint ngoai OpenAPI.

### Deprecated
- Chua co.

### Removed
- Chua co.

### Fixed
- Loai bo khoang trong endpoint giua collection va spec.

### Action required
- Moi app AI phai bám docs/ai-app-sync-plan-v1.md khi onboard.
- PR thay doi docs/openapi bat buoc pass strict parity check.

### Added
- Them bo Postman environment de import nhanh:
  - docs/openapi/environments/local.postman_environment.json
  - docs/openapi/environments/staging.postman_environment.json
  - docs/openapi/environments/prod.postman_environment.json
- Them workflow CI kiem tra API contract:
  - .github/workflows/api-contract.yml
- Them script validation contract:
  - scripts/validate-api-contracts.mjs
  - package script: npm run api:check

### Changed
- README bo sung huong dan import Postman environments va chay API contract CI.

### Deprecated
- Chua co.

### Removed
- Chua co.

### Fixed
- Dam bao Postman collection khong tro endpoint ngoai OpenAPI.
- Bat buoc co endpoint trong yeu trong collection: order/snapshot/dashboard.

### Action required
- Team AI/code import environment dung theo moi moi truong.
- Bat buoc pass npm run api:check truoc khi merge thay doi docs/openapi.

## 2026-04-21 | v1.0.0 | Initial multi-app baseline
Owner: platform-core
Impact: webapp, desktop (future), admin

### Added
- Chot baseline endpoint dang co san trong he thong:
  - GET /api/health
  - GET /api/catalog
  - POST /api/orders
  - POST /api/checkout
  - GET /api/orders/:orderId
  - POST /api/payments/webhooks
  - POST /api/payments/webhooks/sepay
  - POST /api/payments/webhooks/stripe
  - POST /api/payments/mock/confirm
  - POST /api/auth/customer/register/send-code
  - POST /api/auth/customer/register
  - POST /api/auth/customer/login
  - GET /api/auth/me
  - POST /api/auth/customer/logout
  - POST /api/auth/customer/password-reset/send-code
  - POST /api/auth/customer/password-reset/confirm
  - GET /api/auth/google/config
  - POST /api/auth/customer/google
  - GET /api/portal/:customerId
  - POST /api/usage/consume
  - GET /api/admin/dashboard
  - GET /api/admin/me
  - GET /api/admin/users
  - POST /api/admin/users
  - GET /api/admin/admin-users
  - POST /api/admin/admin-users
  - PATCH /api/admin/admin-users/:adminId

### Changed
- Chua co.

### Deprecated
- Chua co.

### Removed
- Chua co.

### Fixed
- Chua co.

### Action required
- Webapp: tiep tuc dung v1.0.0, khong can doi ngay.
- Desktop app: implement theo docs/platform-standard-v1.md truoc khi release.

## Template entry cho lan cap nhat tiep theo

### YYYY-MM-DD | v1.x.x | Ten ban cap nhat
Owner: <team/owner>
Impact: <webapp|desktop|admin|all>

#### Added
- ...

#### Changed
- ...

#### Deprecated
- ...

#### Removed
- ...

#### Fixed
- ...

#### Action required
- ...
