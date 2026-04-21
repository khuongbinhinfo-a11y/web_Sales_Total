# AI App Handoff Bundle

Thu muc nay da gom san cac file can thiet de ban giao cho AI-app.

## 1) Bat dau nhanh
- Gui nguyen folder `docs/ai-app-handoff` cho AI-app.
- Yeu cau AI-app doc file theo thu tu:
  1. `openapi/openapi-v1.yaml`
  2. `openapi/postman-v1.collection.json`
  3. `environments/*.postman_environment.json`
  4. `integration-checklist.md`
  5. `ai-app-sync-plan-v1.md`
  6. `ai-gates/definition-ready-done.<app>.yaml`

## 2) File theo muc dich
- Contract API:
  - `openapi/openapi-v1.yaml`
- Test nhanh Postman:
  - `openapi/postman-v1.collection.json`
  - `environments/local.postman_environment.json`
  - `environments/staging.postman_environment.json`
  - `environments/prod.postman_environment.json`
- Checklist va van hanh:
  - `integration-checklist.md`
  - `ai-app-sync-plan-v1.md`
  - `app-onboarding-ticket-template.md`
- Gate theo app:
  - `ai-gates/definition-ready-done.desktop.yaml`
  - `ai-gates/definition-ready-done.webapp.yaml`
  - `ai-gates/definition-ready-done.admin.yaml`
  - `ai-gates/definition-ready-done.yaml` (fallback)
  - `ai-gates/README.md`

## 3) Prompt giao viec nhanh cho AI-app
```
Ban la AI cua app <desktop/webapp/admin>.
Bat buoc dung OpenAPI lam nguon su that.

Doc file trong folder ai-app-handoff theo thu tu trong INDEX.md.
Trien khai tich hop theo contract hien tai, khong tao endpoint ngoai OpenAPI.
Hoan thanh muc Critical trong integration-checklist.
Cap nhat checklist gate dung file definition-ready-done.<app>.yaml.
Chay va bao cao ket qua:
- npm run api:check
- npm run ai:gate -- --app <app>
Tra ve: Files changed, What implemented, Test results, Remaining risks.
```
