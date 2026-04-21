# App Onboarding Ticket Template (Jira/Trello)

Mau ticket chuan de onboard moi app vao he thong trung tam.
Dung duoc cho Jira Story/Epic hoac Trello card.

## 1. Ticket title (copy)
[APP-ONBOARD][<app-name>] Integrate app voi Platform Standard v1

## 2. Metadata
- App name:
- App type: webapp | desktop | admin | mobile
- Team owner:
- Tech owner:
- Sprint target:
- Target release date:
- Priority: P0 | P1 | P2
- Dependencies:

## 3. Business goal
- App moi su dung chung account, payment, entitlement va license tu web tong.
- Khong tao auth/payment/license rieng.

## 4. Scope
### In scope
- Tich hop auth customer theo Platform Standard v1.
- Tich hop flow order/checkout.
- Dong bo entitlement/license sau thanh toan.
- Hoan tat telemetry va handling trang thai expired/suspended.

### Out of scope
- Tu tao billing provider rieng.
- Tu tao user DB rieng cho production.

## 5. API and docs references
- Platform standard: docs/platform-standard-v1.md
- Integration checklist: docs/integration-checklist.md
- API changelog: docs/api-changelog.md
- OpenAPI contract: docs/openapi/openapi-v1.yaml

## 6. Acceptance criteria
- [ ] Login bang auth trung tam thanh cong.
- [ ] GET /api/auth/me tra dung trang thai user.
- [ ] Lay duoc catalog va tao order qua API.
- [ ] Checkout xong, app dong bo quyen trong <= 60 giay.
- [ ] Xu ly duoc pending/paid/failed/expired/suspended tren UI.
- [ ] Logout xong khong xem duoc du lieu user cu.
- [ ] Pass tat ca muc Critical trong docs/integration-checklist.md.

## 7. Engineering tasks (subtasks)
### A. Auth integration
- [ ] Implement login flow voi POST /api/auth/customer/login.
- [ ] Implement register/send-code/reset-password flow neu app can.
- [ ] Implement session refresh qua GET /api/auth/me.
- [ ] Implement logout qua POST /api/auth/customer/logout.

### B. Catalog and order integration
- [ ] Load product list tu GET /api/catalog.
- [ ] Create order qua POST /api/orders.
- [ ] Redirect checkout toi /pay/:orderId.
- [ ] Implement callback/reload de refresh entitlement sau checkout.

### C. Entitlement and license integration
- [ ] Chi mo feature khi entitlement active.
- [ ] Handle expired/suspended state.
- [ ] Desktop only: bind device + offline grace mode.

### D. Observability and support
- [ ] Attach appVersion vao cac request quan trong.
- [ ] Add error code mapping cho support.
- [ ] Add support CTA khi payment/license fail.

### E. Security
- [ ] Khong hardcode secret.
- [ ] Khong luu plaintext token/password.
- [ ] Verify HTTPS policy cho production.

## 8. Test plan
- [ ] Unit test cac service call auth/order.
- [ ] Integration test voi staging backend.
- [ ] E2E smoke test: login -> order -> pay -> entitlement active.
- [ ] Regression test logout va session expiry.

## 9. QA checklist
- [ ] UI hien thong diep loi de hieu cho user.
- [ ] UI hien dung plan dang active.
- [ ] Nang cap goi tro dung link web tong.
- [ ] Khong leak thong tin nhay cam tren log/client.

## 10. Release checklist
- [ ] Da cap nhat docs/api-changelog.md neu co thay doi API.
- [ ] Da cap nhat docs/platform-standard-v1.md neu co thay doi flow.
- [ ] Da duoc duyet boi platform owner.
- [ ] Da xac nhan rollback plan.

## 11. Risk and mitigation
- Risk:
- Impact:
- Mitigation:

## 12. Rollback plan
- Dieu kien rollback:
- Buoc rollback:
- Cach verify sau rollback:

## 13. Definition of done
- [ ] Tat ca acceptance criteria dat.
- [ ] Tat ca subtask critical da DONE.
- [ ] Co bang chung test (log/video/report).
- [ ] Ready for production release.
