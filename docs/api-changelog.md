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
