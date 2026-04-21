# Web Sales Total

Web Sales Total la SaaS commerce MVP cho web ban phan mem tong.

Muc tieu ban nay:
- Ban goi subscription va one-time top-up
- Tao order va checkout
- Xac nhan thanh toan qua webhook idempotent (Sepay/Stripe/mock)
- Cap subscription, entitlement, wallet, ledger sau thanh toan
- Tu dong cap key ngay sau khi don paid (neu con key ton kho)
- Co route rieng cho homepage, portal va admin
- San sang deploy theo monolith Node.js + Express + PostgreSQL

## Kien truc
- Backend entry: `src/server.js`
- Frontend tinh: `src/web/*`, duoc serve truc tiep boi Express
- Database: PostgreSQL
- Business logic: `src/modules/store.js`
- Payment flow (Sepay-first, mock/stripe fallback): `src/modules/payment.js`

## Yeu cau moi truong
Copy `.env.example` thanh `.env` va cap nhat gia tri:

```env
PORT=3900
DATABASE_URL=postgres://postgres:postgres@localhost:5432/web_sales_total
WEBHOOK_SIGNATURE_SECRET=demo-signature
PAYMENT_PROVIDER_MODE=mock
APP_BASE_URL=http://localhost:3900
NODE_ENV=development
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SEPAY_WEBHOOK_SECRET=
SEPAY_BANK_CODE=970422
SEPAY_BANK_ACCOUNT_NUMBER=
SEPAY_ACCOUNT_NAME=
SEPAY_QR_TEMPLATE_URL=
SESSION_SIGNING_SECRET=replace-with-strong-secret
PORTAL_ACCESS_KEY=portal-demo
ADMIN_ACCESS_KEY=
ADMIN_OWNER_KEY_LOGIN_ENABLED=false
ADMIN_LOGIN_WINDOW_MS=900000
ADMIN_LOGIN_MAX_ATTEMPTS=5
ADMIN_LOGIN_LOCKOUT_MS=900000
ADMIN_OTP_TTL_MS=600000
ADMIN_OTP_REQUIRED_ROLES=owner,manager
GITHUB_TOKEN=
GITHUB_REPO_OWNER=khuongbinhinfo-a11y
GITHUB_REPO_NAME=web_Sales_Total
GITHUB_REPO_BRANCH=main
```

Ghi chu:
- `PAYMENT_PROVIDER_MODE=sepay` la mode khuyen nghi khi ban that
- `PAYMENT_PROVIDER_MODE=mock` dung cho MVP test end-to-end
- `PAYMENT_PROVIDER_MODE=stripe` dung adapter webhook Stripe
- Sepay webhook se xac thuc bang `SEPAY_WEBHOOK_SECRET`
- Portal/Admin dang duoc bao ve boi session cookie ky so (muc toi thieu)

## Chay local
1. Cai package:
```bash
npm install
```

2. Chay PostgreSQL (neu dung Docker):
```bash
docker compose up -d
```

3. Chay migration + seed:
```bash
npm run db:setup
```

4. Chay app:
```bash
npm run dev
```

5. Mo cac route:
- Homepage: `http://localhost:3900/`
- Portal: `http://localhost:3900/portal`
- Admin: `http://localhost:3900/admin`

## Scripts
- `npm run dev`: chay local voi nodemon
- `npm start`: chay server production mode (khong watch)
- `npm run db:migrate`: apply SQL migrations
- `npm run db:seed`: seed du lieu mau
- `npm run db:setup`: migrate + seed

## API chinh
- `GET /api/health`
- `GET /api/catalog`
- `POST /api/orders`
- `GET /api/orders/:orderId`
- `POST /api/payments/webhooks`
- `POST /api/payments/webhooks/stripe`
- `POST /api/payments/webhooks/sepay`
- `POST /api/payments/mock/confirm`
- `POST /api/usage/consume`
- `GET /api/portal/:customerId`
- `GET /api/customers/:customerId/snapshot`
- `GET /api/admin/dashboard`

Legacy alias van hoat dong:
- `POST /api/checkout`
- `POST /api/webhooks/payment`

## Smoke test nhanh
1. Vao homepage, bam `Mua ngay` de tao order.
2. Trang `/pay/:orderId` hien thong tin chuyen khoan Sepay (hoac mock mode).
3. Thanh toan that: Sepay callback vao `/api/payments/webhooks/sepay` de paid + cap key tu dong.
4. Mock mode: bam `Xac nhan da thanh toan` de goi endpoint mock confirm.
5. Vao `/portal` de xem wallet, ledger, subscriptions cap nhat.
6. Vao `/admin` de xem KPI va giao dich moi.

## Auth toi thieu cho Portal/Admin
- Login portal: `GET /portal/login` (dung `PORTAL_ACCESS_KEY`)
- Login admin: `GET /admin/login` (uu tien username/password tu `admin_users`)
- Owner key login qua `ADMIN_ACCESS_KEY` mac dinh bi tat, chi bat khi set `ADMIN_OWNER_KEY_LOGIN_ENABLED=true`
- Dang nhap admin co gioi han brute-force theo IP (429 + lockout tam thoi neu sai nhieu lan)
- Role `owner` va `manager` bat buoc OTP email khi login thanh cong password (2FA)
- Tu dong guard theo 3 lop: `ip`, `username`, va cap `ip|username` de chan tan cong phan tan
- Audit day du login admin vao DB (success, failure, blocked, challenge OTP): bang `admin_login_audits`
- API portal va admin yeu cau cookie session hop le
- Canh bao bao mat: production bat buoc `SESSION_SIGNING_SECRET` manh; neu bat owner key login thi `ADMIN_ACCESS_KEY` phai dai >= 16 ky tu va khong dung gia tri demo.

## Stripe webhook adapter
- Dat `PAYMENT_PROVIDER_MODE=stripe`
- Cau hinh `STRIPE_SECRET_KEY` va `STRIPE_WEBHOOK_SECRET`
- Gui webhook vao `POST /api/payments/webhooks/stripe`
- Event ho tro: `checkout.session.completed`, `payment_intent.succeeded`
- Metadata bat buoc: `orderId` hoac `order_id`

## Sepay webhook + auto delivery key
- Dat `PAYMENT_PROVIDER_MODE=sepay`
- Cau hinh:
  - `SEPAY_WEBHOOK_SECRET`
  - `SEPAY_BANK_CODE`
  - `SEPAY_BANK_ACCOUNT_NUMBER`
  - `SEPAY_ACCOUNT_NAME`
  - `SEPAY_QR_TEMPLATE_URL` (khong bat buoc)
- Endpoint callback: `POST /api/payments/webhooks/sepay`
- Header xac thuc webhook ho tro: `x-sepay-signature`, `x-sepay-token`, hoac `Authorization: Bearer <secret>`
- Payload can mang `orderId`/`order_id` hoac co `orderId` trong noi dung chuyen khoan.
- Khi paid thanh cong: order -> paid, cap subscription/wallet/ledger va cap key tu dong neu ton kho con key.

## Deploy Cloud Run (co ban)
1. Tao PostgreSQL (Cloud SQL hoac external) va lay `DATABASE_URL`.
2. Build va deploy service:
```bash
gcloud run deploy web-sales-total \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080,NODE_ENV=production,PAYMENT_PROVIDER_MODE=mock,APP_BASE_URL=https://<your-service-url>,WEBHOOK_SIGNATURE_SECRET=<strong-secret>,SESSION_SIGNING_SECRET=<strong-secret>,PORTAL_ACCESS_KEY=<portal-key>,ADMIN_OWNER_KEY_LOGIN_ENABLED=false,DATABASE_URL=<postgres-url>
```

3. Cloud Run se cap `PORT`, app da su dung `process.env.PORT`.

## Pham vi MVP hien tai
- Auth hien tai la muc toi thieu (chua RBAC/chua user management)
- Stripe adapter webhook co san, checkout provider that chua hoan tat
- Chua co recurring billing automation theo nha cung cap thanh toan

## Tai lieu dieu phoi da app
- Chuan dong bo he thong (web tong, desktop app, webapp): [docs/platform-standard-v1.md](docs/platform-standard-v1.md)
- Checklist tich hop cho moi app: [docs/integration-checklist.md](docs/integration-checklist.md)
- Lich su thay doi API: [docs/api-changelog.md](docs/api-changelog.md)
- Mau ticket onboard app moi (Jira/Trello): [docs/templates/app-onboarding-ticket-template.md](docs/templates/app-onboarding-ticket-template.md)
- API contract OpenAPI v1: [docs/openapi/openapi-v1.yaml](docs/openapi/openapi-v1.yaml)
- Postman Collection v1 (import test ngay): [docs/openapi/postman-v1.collection.json](docs/openapi/postman-v1.collection.json)
- Postman environments:
  - Local: [docs/openapi/environments/local.postman_environment.json](docs/openapi/environments/local.postman_environment.json)
  - Staging: [docs/openapi/environments/staging.postman_environment.json](docs/openapi/environments/staging.postman_environment.json)
  - Production: [docs/openapi/environments/prod.postman_environment.json](docs/openapi/environments/prod.postman_environment.json)
- Ke hoach dong bo cho AI cua cac app: [docs/ai-app-sync-plan-v1.md](docs/ai-app-sync-plan-v1.md)
- Bo ho so ban giao 1 folder cho AI-app: [docs/ai-app-handoff/INDEX.md](docs/ai-app-handoff/INDEX.md)

## API contract CI
- Script kiem tra local: `npm run api:check`
- CI workflow: [.github/workflows/api-contract.yml](.github/workflows/api-contract.yml)
- Script se kiem tra:
  - OpenAPI YAML hop le (parser validation)
  - Postman collection khong chua endpoint la ngoai OpenAPI
  - Postman collection co day du endpoint trong yeu (order/snapshot/entitlement/dashboard)

## AI merge gate (Definition of Ready/Done)
- Checklist may doc duoc: [docs/ai-gates/definition-ready-done.yaml](docs/ai-gates/definition-ready-done.yaml)
- Checklist theo app:
  - Desktop: [docs/ai-gates/definition-ready-done.desktop.yaml](docs/ai-gates/definition-ready-done.desktop.yaml)
  - Webapp: [docs/ai-gates/definition-ready-done.webapp.yaml](docs/ai-gates/definition-ready-done.webapp.yaml)
  - Admin: [docs/ai-gates/definition-ready-done.admin.yaml](docs/ai-gates/definition-ready-done.admin.yaml)
- Script kiem tra local: `npm run ai:gate`
- CI workflow: [.github/workflows/ai-readiness-gate.yml](.github/workflows/ai-readiness-gate.yml)
- Neu `enforcement.blockMerge=true` va con item required chua `passed: true`, CI se fail de chan merge.
- Huong dan quan ly gate: [docs/ai-gates/README.md](docs/ai-gates/README.md)
- UI admin quan ly gate:
  - Vao `/admin` -> muc `AI Gate`
  - Xem trang thai gate theo app
  - Chinh `passed` + `evidence` va luu checklist
  - Commit checklist len GitHub qua API (can `GITHUB_TOKEN`)
