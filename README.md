# Web Sales Total (MVP)

Ban khoi dau cho he thong web ban hang tong da app theo mo hinh modular monolith.

## Tinh nang da co
- Public catalog app + product
- Tao checkout order
- Mock payment page va webhook callback
- Idempotency webhook event
- Grant subscription + entitlement + credit wallet + ledger
- Customer portal JSON
- Admin dashboard JSON

## Chay local tren VS Code
1. Mo terminal tai workspace `f:/web_Sales_Total`
2. Chay `npm install` (neu chua cai package)
3. Khoi dong PostgreSQL bang Docker: `docker compose up -d`
4. Chay migration + seed: `npm run db:setup`
5. Chay server: `npm run dev`
6. Mo URL: `http://localhost:3900`

Neu gap loi ket noi Docker API, hay mo Docker Desktop truoc khi chay `docker compose up -d`.

Mac dinh project nay dung cong 3900 de tranh trung voi cac website local khac cua ban.

## Bien moi truong
- File mau: `.env.example`
- File chay local da tao san: `.env`

Gia tri mac dinh:
- `PORT=3900`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/web_sales_total`
- `WEBHOOK_SIGNATURE_SECRET=demo-signature`

## Luong test nhanh
1. Vao trang catalog va bam `Mua ngay`
2. Cua so payment mock mo ra tai `/pay/{orderId}`
3. Bam `Xac nhan da thanh toan`
4. Quay lai trang chinh, bam `Tai portal` va `Tai admin dashboard` de xem du lieu cap nhat

## API chinh
- `GET /api/catalog`
- `POST /api/checkout`
- `POST /api/webhooks/payment`
- `POST /api/usage/consume`
- `GET /api/portal/:customerId`
- `GET /api/admin/dashboard`
- `GET /api/health`

## Consume usage API
Endpoint: `POST /api/usage/consume`

Payload mau:
```json
{
	"customerId": "cus-demo",
	"appId": "app-study-12",
	"featureKey": "ai_tutor_chat",
	"creditsToConsume": 5,
	"units": 1,
	"requestId": "req-usage-001",
	"metadata": {
		"model": "gpt-4o-mini",
		"sessionId": "s123"
	}
}
```

Ket qua:
- Du credit: tru wallet, ghi `credit_ledger` reason `usage_consume`, ghi `ai_usage_logs` status `consumed`.
- Thieu credit: khong tru wallet, van ghi `ai_usage_logs` status `rejected_insufficient`.

## Top-up flow theo ledger
- Product co `cycle = one_time` se duoc xu ly la top-up.
- Khi webhook payment thanh cong: cong wallet + ghi ledger reason `topup_purchase`.
- Top-up khong ghi de subscription/entitlement hien tai.

## Lenh DB
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:setup`

## Dinh huong tiep theo
- Tach module thanh toan that (provider that)
- Dua database PostgreSQL + migration
- Them RBAC admin theo app
- Them Notification Center (queue + retry)
