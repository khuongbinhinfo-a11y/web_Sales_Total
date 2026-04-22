# Cap01 Send Now To AI-app - 2026-04-22

Noi dung ngan gon de gui ngay cho AI-app.

```text
Cap01 local da xong phan khoa tinh nang theo key/license o app.

Trang thai san sang hien tai:
- Da goi API license list + verify
- Da doc features va license.status
- Da co ham check quyen tu features / license active
- Da co cache local + offline grace
- Da co backend proxy de gui key phia server, khong lo ra frontend

Con 2 viec de bat production that:
1. Web tong can dat WEB_TOTAL_AI_APP_KEY that tren production
2. AI-app can xac nhan endpoint production /api/ai-app/* dang tra dung contract verify:
   - features[]
   - grace { allowed, graceDays, offlineUntil }

Contract Web tong da san sang cho AI-app:
- GET /api/ai-app/customers/:customerId/licenses
- POST /api/ai-app/licenses/verify

App/product map dang dung:
- appId: app-study-12
- standard monthly: prod-study-month
- standard yearly: prod-study-year
- standard lifetime: prod-study-standard-lifetime
- premium monthly: prod-study-premium-month
- premium yearly: prod-study-premium-year
- premium lifetime: prod-study-premium-lifetime

Noi ngan gon: phia app da khoa xong. Ben minh chi con noi production tu AIT de chay that 100%.
```