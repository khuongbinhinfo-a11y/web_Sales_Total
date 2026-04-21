# AI Gates Management

Tai lieu nay giai thich cach quan ly checklist Definition of Ready/Done cho tung app.

## 1. File checklist hien co
- docs/ai-gates/definition-ready-done.yaml (default fallback)
- docs/ai-gates/definition-ready-done.desktop.yaml
- docs/ai-gates/definition-ready-done.webapp.yaml
- docs/ai-gates/definition-ready-done.admin.yaml

## 2. Co che tu chon file theo branch/PR
Script gate: scripts/validate-ready-done.mjs

Thu tu chon checklist:
1. Neu co `--app <name>` hoac env `APP_NAME`, script uu tien file theo app do.
2. Neu khong co app explicit, script suy ra app tu `BRANCH_NAME`.
3. Neu khong tim thay app-specific file, script fallback ve default checklist.

Vi du branch:
- feature/desktop-license-sync -> desktop
- fix/webapp-checkout-refresh -> webapp
- chore/admin-role-policy -> admin

## 3. Lenh su dung
- Auto (theo branch):
  - npm run ai:gate
- Explicit theo app:
  - npm run ai:gate -- --app desktop
  - npm run ai:gate -- --app webapp
  - npm run ai:gate -- --app admin

## 4. Cach quan ly hang ngay (khong can UI rieng)
- Quan ly bang Git PR:
  1. Mo file checklist cua app.
  2. Cap nhat `passed` va `evidence`.
  3. Tao PR, CI tu dong check gate.
- Merge se bi chan neu item required chua dat.

## 5. Neu ban muon co UI
Hien tai he thong la policy-as-code (YAML + CI), chua co UI dashboard.
Neu can UI, de xuat 2 huong:
1. Nhanh: dung GitHub issue form + action dong bo vao YAML.
2. Day du: tao trang admin read/write checklist (luu YAML trong repo qua GitHub API).
