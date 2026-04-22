# Production Database Sync - Complete Guide

## Status
✅ **Git Push Complete**: Migration file committed and pushed to GitHub (commit 66c2f97)
⏳ **Vercel Deployment**: Triggered automatically (1-2 min to complete)
📋 **Database Sync**: TWO OPTIONS AVAILABLE (choose one)

---

## OPTION A: Automatic (Recommended - Wait for Vercel)
**Timeline**: 2-3 minutes  
**Action**: Nothing - Vercel will auto-deploy and run migrations on startup

**Steps**:
1. Wait 2-3 minutes for Vercel to complete deployment
2. Verify via: `curl https://ungdungthongminh.shop/api/catalog | grep demo-map`
3. Refresh browser to see Product 3 (demo-map) on homepage

**Why it works**:
- Git push triggers Vercel webhook
- Vercel redeploys app with new code
- Server startup runs `src/db/migrate.js`
- Migration executes automatically on startup

---

## OPTION B: Immediate (Manual - Execute Now)
**Timeline**: 30 seconds  
**Action**: Execute SQL on Cloud SQL console

**Steps**:
1. Open Google Cloud Console → SQL → websalestotal
2. Open Query Editor
3. Copy-paste from: `PRODUCTION_SYNC_EXECUTE.sql` (in this folder)
4. Click Execute
5. Verify: `SELECT COUNT(*) FROM products WHERE app_id IN ('app-study-12', 'lamviec');`
   - Expected result: `10` rows

---

## What This Does
Syncs production database with 100% local parity:

**Study App (app-study-12)** - 8 products:
- prod-test-2k: INTERNAL test @ 2,000 VND (for QA)
- prod-study-month: Monthly @ 89,000 VND
- prod-study-year: Yearly @ 599,000 VND
- prod-study-premium-month: Premium monthly @ 119,000 VND
- prod-study-premium-year: Premium yearly @ 899,000 VND
- prod-study-standard-lifetime: Lifetime @ 999,000 VND
- prod-study-premium-lifetime: Premium lifetime @ 1,599,000 VND
- prod-study-topup: 300 credit top-up @ 149,000 VND

**Work App (lamviec)** - 1 product:
- demo-map: Google Map scraper @ 499,000 VND (with 3 credits)

**Total**: 10 products synced (same as local environment)

---

## Verification Checklist

After sync:
1. ✅ Check /api/catalog endpoint: `mapProductsCount` should be `1` (demo-map)
2. ✅ Visit homepage: 3rd product card (demo-map) should display
3. ✅ Product name: "Phần Mềm Quét Data Khách Hàng Trên Google Map"
4. ✅ Product price: "499,000 VND"
5. ✅ Product image: Should show without "Chưa mở bán" (out of stock)

---

## Troubleshooting

**If demo-map still not showing after 5 minutes**:
1. Check migration file was pushed: `git log --oneline | head -5`
2. Check Vercel deployment: console.vercel.com
3. If still missing, execute OPTION B immediately

**If SQL execution fails**:
- Error: "Duplicate key value" → OK, this means it was already synced
- Error: "Column not found" → Contact support, schema mismatch
- Error: "Permission denied" → Check Cloud SQL credentials

---

## Git Commit Reference
- **File created**: migrations/PROD_SYNC_013_015.sql (73 lines)
- **Commit hash**: 66c2f97
- **Committed**: 2026-04-22
- **Branch**: main
- **Message**: "chore: production sync migrations 013+015"

---

## Next Steps
1. **Immediate**: Choose Option A (wait) or Option B (execute now)
2. **5 minutes**: Verify product shows on production domain
3. **Complete**: Demo-map should be visible on homepage alongside Study products

---

All statements are **idempotent** (safe to re-run without issues).
