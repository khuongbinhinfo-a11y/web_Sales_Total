const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { pool } = require("../db/pool");
const {
  BLOOMIA_APP_ID,
  createBloomiaActivationToken,
  computeBloomiaOfflineUntil,
  buildBloomiaOfflineLeasePayload,
  generateBloomiaLicenseKey,
  hashBloomiaActivationToken,
  normalizeBloomiaAppId,
  normalizeBloomiaDeviceName,
  normalizeBloomiaLicenseKey,
  normalizeBloomiaMachineId,
  signBloomiaOfflineLease
} = require("./bloomiaLicenses");
const { env } = require("../config/env");
const {
  CAP01_BLOCKED_APP_IDS,
  CAP01_BLOCKED_PRODUCT_IDS,
  isCap01AppId,
  isCap01ProductId
} = require("../data/cap01");

function isR2PrivateArtifactsEnabledForRegistry() {
  const value = String(process.env.R2_PRIVATE_ARTIFACTS_ENABLED || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

const LICENSE_RUNTIME_LEASE_SECONDS = 180;
const appUpdatesRoot = path.join(__dirname, "..", "..", "public", "app-updates");
const APP_REGISTRY_DELIVERY_TYPES = new Set(["website", "manifest_download", "manual_delivery"]);
const CAP01_PRODUCT_LICENSE_CONFIG = {};

function getCap01ProductLicenseConfig(productIdRaw) {
  const productId = String(productIdRaw || "").trim().toLowerCase();
  return CAP01_PRODUCT_LICENSE_CONFIG[productId] || null;
}

function normalizePublicAppId(appIdRaw) {
  const normalized = String(appIdRaw || "").trim().toLowerCase();
  return normalized;
}

function resolveAppIdCandidates(appIdRaw) {
  const normalized = normalizePublicAppId(appIdRaw);
  if (!normalized) return [];
  if (normalized === "app-study-12") {
    return ["app-study-12"];
  }
  return [normalized];
}

function generateReadableOrderCode() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `WST-${timePart}-${randomPart}`;
}

function mapOrder(row) {
  const amount = Number(row.amount);
  const subtotalAmount = Number(row.subtotal_amount ?? row.amount);
  const discountAmount = Number(row.discount_amount ?? 0);
  const discountPercent = Number(row.discount_percent ?? 0);
  return {
    id: row.id,
    orderCode: row.order_code,
    customerId: row.customer_id,
    appId: normalizePublicAppId(row.app_id),
    productId: row.product_id,
    amount,
    subtotalAmount,
    discountAmount,
    discountPercent,
    discountCode: row.discount_code || null,
    currency: row.currency,
    metadata: row.metadata || {},
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at
  };
}

function mapDiscountCode(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    code: row.code,
    percentOff: Number(row.percent_off),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: Boolean(row.active),
    singleUse: row.single_use !== false,
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByAdminId: row.created_by_admin_id || null,
    createdByUsername: row.created_by_username || null,
    usedAt: row.used_at || null,
    usedOrderId: row.used_order_id || null,
    usedOrderCode: row.used_order_code || null,
    usageStatus: row.usage_status || "available",
    reservedOrderId: row.reserved_order_id || null,
    reservedOrderCode: row.reserved_order_code || null
  };
}

function normalizeDiscountCode(value) {
  return String(value || "").trim().toUpperCase();
}

function createStoreError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeAppRegistryDeliveryType(value, fallback = "manual_delivery") {
  const normalized = String(value || "").trim().toLowerCase();
  return APP_REGISTRY_DELIVERY_TYPES.has(normalized) ? normalized : fallback;
}

function normalizeAppRegistryText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeAppRegistryUrl(value) {
  const normalized = String(value || "").trim();
  return normalized;
}

function isValidAppRegistryUrl(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return true;
  }
  if (normalized.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function computeAppRegistryHealthStatus(score) {
  const safeScore = Math.max(0, Number(score) || 0);
  if (safeScore >= 80) return "green";
  if (safeScore >= 50) return "yellow";
  return "red";
}

function readLocalAppManifest(appIdRaw) {
  const appId = String(appIdRaw || "").trim();
  if (!appId) {
    return null;
  }
  const manifestPath = path.join(appUpdatesRoot, appId, "version.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    return { appId, manifestPath, manifest };
  } catch {
    return null;
  }
}

function getLocalArtifactPathFromDownloadUrl(appIdRaw, downloadUrlRaw) {
  const appId = String(appIdRaw || "").trim();
  const downloadUrl = String(downloadUrlRaw || "").trim();
  if (!appId || !downloadUrl) {
    return null;
  }

  let pathname = downloadUrl;
  if (/^https?:\/\//i.test(downloadUrl)) {
    try {
      pathname = new URL(downloadUrl).pathname || "";
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith("/app-updates/")) {
    return null;
  }

  const relativePath = pathname.slice("/app-updates/".length).replace(/^[/\\]+/, "").replace(/\\/g, "/");
  if (!relativePath.startsWith(`${appId}/`)) {
    return null;
  }

  const absolutePath = path.resolve(appUpdatesRoot, relativePath);
  const rootPath = `${path.resolve(appUpdatesRoot)}${path.sep}`;
  if (!absolutePath.startsWith(rootPath)) {
    return null;
  }
  return absolutePath;
}

function normalizeLatestCheckRow(row) {
  if (!row) {
    return {
      criticalCount: 0,
      warningCount: 0,
      lastCheckedAt: null
    };
  }

  return {
    criticalCount: Number(row.critical_count || 0),
    warningCount: Number(row.warning_count || 0),
    lastCheckedAt: row.last_checked_at || null
  };
}

function mapAppRegistryRow(row) {
  const criticalCount = Number(row.critical_count || 0);
  const warningCount = Number(row.warning_count || 0);
  return {
    appId: normalizePublicAppId(row.app_id),
    displayName: row.display_name,
    appNameFromAppsTable: row.app_name,
    slug: row.slug,
    status: row.app_status,
    description: row.app_description || "",
    businessGroup: row.business_group || "general",
    deliveryType: normalizeAppRegistryDeliveryType(row.delivery_type),
    webUrl: row.web_url || "",
    pricingUrl: row.pricing_url || "",
    downloadUrl: row.download_url || "",
    manifestUrl: row.manifest_url || "",
    releaseNotesUrl: row.release_notes_url || "",
    updateChannel: row.update_channel || "stable",
    ownerName: row.owner_name || "",
    supportUrl: row.support_url || "",
    supportSlaHours: Number(row.support_sla_hours || 24),
    publicReady: Boolean(row.public_ready),
    checklistNote: row.checklist_note || "",
    healthStatus: row.health_status || "unknown",
    healthScore: Number(row.health_score || 0),
    activeProductCount: Number(row.active_product_count || 0),
    liveProductCount: Number(row.live_product_count || 0),
    criticalCount,
    warningCount,
    hasCriticalIssues: criticalCount > 0,
    hasDownloadUrl: Boolean(String(row.download_url || "").trim()),
    hasManifest: Boolean(String(row.manifest_url || "").trim()),
    lastVerifiedAt: row.last_verified_at || null,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

function summarizeAppRegistryChecks(checks) {
  const safeChecks = Array.isArray(checks) ? checks : [];
  const criticalCount = safeChecks.filter((item) => item.severity === "critical" && item.passed === false).length;
  const warningCount = safeChecks.filter((item) => item.severity === "warning" && item.passed === false).length;
  const passedCount = safeChecks.filter((item) => item.passed === true).length;
  const totalChecks = safeChecks.length;
  const score = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);
  return {
    score,
    healthStatus: computeAppRegistryHealthStatus(score),
    criticalCount,
    warningCount,
    passedCount,
    totalChecks
  };
}

function inferDefaultRegistrySeed(app) {
  const appId = String(app?.id || "").trim();
  if (isCap01AppId(appId)) {
    return null;
  }
  const manifestRecord = readLocalAppManifest(appId);
  const manifest = manifestRecord?.manifest || {};
  const hasManifest = Boolean(manifestRecord);
  const deliveryType = hasManifest ? "manifest_download" : "manual_delivery";
  return {
    displayName: String(app?.name || appId || "Ứng dụng").trim(),
    deliveryType,
    webUrl: "",
    pricingUrl: "",
    downloadUrl: String(manifest.downloadPath || "").trim(),
    manifestUrl: hasManifest ? `/api/v1/app-updates/${appId}/manifest` : "",
    releaseNotesUrl: String(manifest.releaseNotesPath || "").trim(),
    supportUrl: "https://zalo.me/0902964685"
  };
}

async function ensureAppRegistryRows() {
  const appsResult = await pool.query(
    "SELECT id, name FROM apps ORDER BY created_at ASC"
  );

  for (const row of appsResult.rows) {
    if (isCap01AppId(row.id)) {
      continue;
    }
    const seed = inferDefaultRegistrySeed(row);
    if (!seed) {
      continue;
    }
    await pool.query(
      `INSERT INTO app_registry(
         app_id, display_name, delivery_type, web_url, pricing_url,
         download_url, manifest_url, release_notes_url, support_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (app_id) DO NOTHING`,
      [
        row.id,
        seed.displayName,
        seed.deliveryType,
        seed.webUrl,
        seed.pricingUrl,
        seed.downloadUrl,
        seed.manifestUrl,
        seed.releaseNotesUrl,
        seed.supportUrl
      ]
    );
  }
}

async function queryAdminAppRegistryRows() {
  await ensureAppRegistryRows();

  const result = await pool.query(
    `WITH latest_batch_ids AS (
       SELECT DISTINCT ON (app_id) app_id, check_batch_id
       FROM app_registry_checks
       ORDER BY app_id, checked_at DESC
     )
     SELECT a.id AS app_id,
            a.name AS app_name,
            a.slug,
            a.status AS app_status,
            a.description AS app_description,
            ar.display_name,
            ar.business_group,
            ar.delivery_type,
            ar.web_url,
            ar.pricing_url,
            ar.download_url,
            ar.manifest_url,
            ar.release_notes_url,
            ar.update_channel,
            ar.owner_name,
            ar.support_url,
            ar.support_sla_hours,
            ar.public_ready,
            ar.checklist_note,
            ar.health_status,
            ar.health_score,
            ar.last_verified_at,
            ar.created_at,
            ar.updated_at,
            COUNT(p.id) FILTER (WHERE p.active = TRUE) AS active_product_count,
            COUNT(p.id) FILTER (WHERE p.active = TRUE AND COALESCE(p.sale_status, 'live') = 'live') AS live_product_count,
            COALESCE(checks.critical_count, 0) AS critical_count,
            COALESCE(checks.warning_count, 0) AS warning_count,
            checks.last_checked_at
     FROM apps a
     JOIN app_registry ar ON ar.app_id = a.id
     LEFT JOIN products p ON p.app_id = a.id
     LEFT JOIN latest_batch_ids lbi ON lbi.app_id = a.id
     LEFT JOIN LATERAL (
       SELECT COUNT(*) FILTER (WHERE severity = 'critical' AND passed = FALSE) AS critical_count,
              COUNT(*) FILTER (WHERE severity = 'warning' AND passed = FALSE) AS warning_count,
              MAX(checked_at) AS last_checked_at
       FROM app_registry_checks c
       WHERE c.app_id = a.id
         AND c.check_batch_id = lbi.check_batch_id
     ) checks ON TRUE
     WHERE a.id <> ALL($1::text[])
     GROUP BY a.id, a.name, a.slug, a.status, a.description,
              ar.display_name, ar.business_group, ar.delivery_type, ar.web_url, ar.pricing_url,
              ar.download_url, ar.manifest_url, ar.release_notes_url, ar.update_channel,
              ar.owner_name, ar.support_url, ar.support_sla_hours, ar.public_ready,
              ar.checklist_note, ar.health_status, ar.health_score, ar.last_verified_at,
              ar.created_at, ar.updated_at,
              checks.critical_count, checks.warning_count, checks.last_checked_at
     ORDER BY a.created_at ASC`,
    [Array.from(CAP01_BLOCKED_APP_IDS)]
  );

  return result.rows.map(mapAppRegistryRow);
}

function filterAdminAppRegistryItems(items, filters = {}) {
  const safeItems = Array.isArray(items) ? items : [];
  const keyword = normalizeAppRegistryText(filters.keyword, 80).toLowerCase();
  const status = normalizeAppRegistryText(filters.status, 20).toLowerCase();
  const sortBy = normalizeAppRegistryText(filters.sortBy, 30) || "risk";
  const order = normalizeAppRegistryText(filters.order, 10).toLowerCase() === "asc" ? "asc" : "desc";
  const staleDays = Math.max(0, Number(filters.staleDays) || 0);
  const requireMissingDownload = filters.missingDownload === true || String(filters.missingDownload || "").toLowerCase() === "true";
  const publicReadyFilter = String(filters.publicReady || "").trim().toLowerCase();

  let next = safeItems.filter((item) => {
    if (keyword) {
      const haystack = `${item.displayName} ${item.appId} ${item.appNameFromAppsTable}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }
    if (status && item.healthStatus !== status) {
      return false;
    }
    if (publicReadyFilter === "true" && item.publicReady !== true) {
      return false;
    }
    if (publicReadyFilter === "false" && item.publicReady !== false) {
      return false;
    }
    if (requireMissingDownload && item.hasDownloadUrl) {
      return false;
    }
    if (staleDays > 0) {
      const lastVerifiedAt = item.lastVerifiedAt ? new Date(item.lastVerifiedAt).getTime() : 0;
      const staleMs = staleDays * 24 * 60 * 60 * 1000;
      if (lastVerifiedAt && Date.now() - lastVerifiedAt < staleMs) {
        return false;
      }
    }
    return true;
  });

  next.sort((left, right) => {
    let delta = 0;
    if (sortBy === "displayName") {
      delta = String(left.displayName || "").localeCompare(String(right.displayName || ""), "vi");
    } else if (sortBy === "updatedAt") {
      delta = new Date(left.updatedAt || 0).getTime() - new Date(right.updatedAt || 0).getTime();
    } else {
      delta = (left.criticalCount - right.criticalCount) || (left.warningCount - right.warningCount) || (left.healthScore - right.healthScore);
    }
    return order === "asc" ? delta : -delta;
  });

  return next;
}

async function listAdminAppRegistry(filters = {}) {
  const items = filterAdminAppRegistryItems(await queryAdminAppRegistryRows(), filters);
  const allItems = await queryAdminAppRegistryRows();
  return {
    summary: {
      totalApps: allItems.length,
      greenApps: allItems.filter((item) => item.healthStatus === "green").length,
      yellowApps: allItems.filter((item) => item.healthStatus === "yellow").length,
      redApps: allItems.filter((item) => item.healthStatus === "red").length,
      publicReadyApps: allItems.filter((item) => item.publicReady).length,
      missingDownloadApps: allItems.filter((item) => !item.hasDownloadUrl).length,
      staleVerifyApps: allItems.filter((item) => {
        if (!item.lastVerifiedAt) return true;
        return Date.now() - new Date(item.lastVerifiedAt).getTime() > 7 * 24 * 60 * 60 * 1000;
      }).length
    },
    items
  };
}

async function getLatestAppRegistryChecks(appId) {
  const batchResult = await pool.query(
    `SELECT check_batch_id
     FROM app_registry_checks
     WHERE app_id = $1
     ORDER BY checked_at DESC
     LIMIT 1`,
    [appId]
  );

  if (batchResult.rowCount === 0) {
    return [];
  }

  const result = await pool.query(
    `SELECT check_code, severity, passed, message, detail_json, health_status, health_score, checked_at
     FROM app_registry_checks
     WHERE app_id = $1 AND check_batch_id = $2::uuid
     ORDER BY severity DESC, check_code ASC`,
    [appId, batchResult.rows[0].check_batch_id]
  );

  return result.rows.map((row) => ({
    checkCode: row.check_code,
    severity: row.severity,
    passed: Boolean(row.passed),
    message: row.message,
    detail: row.detail_json || {},
    healthStatus: row.health_status,
    healthScore: Number(row.health_score || 0),
    checkedAt: row.checked_at
  }));
}

async function listAppRegistryCheckHistory(appId, limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const result = await pool.query(
    `SELECT check_batch_id,
            MAX(checked_at) AS checked_at,
            MAX(health_status) AS health_status,
            MAX(health_score) AS health_score,
            COUNT(*) FILTER (WHERE severity = 'critical' AND passed = FALSE) AS critical_count,
            COUNT(*) FILTER (WHERE severity = 'warning' AND passed = FALSE) AS warning_count
     FROM app_registry_checks
     WHERE app_id = $1
     GROUP BY check_batch_id
     ORDER BY MAX(checked_at) DESC
     LIMIT $2`,
    [appId, safeLimit]
  );

  return result.rows.map((row) => ({
    checkBatchId: row.check_batch_id,
    checkedAt: row.checked_at,
    healthStatus: row.health_status || "unknown",
    healthScore: Number(row.health_score || 0),
    criticalCount: Number(row.critical_count || 0),
    warningCount: Number(row.warning_count || 0)
  }));
}

async function getAdminAppRegistryDetail(appId) {
  const safeAppId = String(appId || "").trim();
  if (!safeAppId) {
    throw createStoreError("Thiếu appId", 400);
  }

  if (isCap01AppId(safeAppId)) {
    throw createStoreError("Không tìm thấy app trong registry", 404);
  }

  const rows = await queryAdminAppRegistryRows();
  const app = rows.find((item) => item.appId === safeAppId);
  if (!app) {
    throw createStoreError("Không tìm thấy app trong registry", 404);
  }

  const productsResult = await pool.query(
    `SELECT id, name, sale_status, active, visibility
     FROM products
     WHERE app_id = $1
     ORDER BY created_at ASC`,
    [safeAppId]
  );

  const checks = await getLatestAppRegistryChecks(safeAppId);
  const history = await listAppRegistryCheckHistory(safeAppId, 20);

  return {
    app,
    catalog: {
      activeProductCount: app.activeProductCount,
      liveProductCount: app.liveProductCount,
      products: productsResult.rows.map((row) => ({
        productId: row.id,
        productName: row.name,
        saleStatus: normalizeProductSaleStatus(row.sale_status),
        active: Boolean(row.active),
        visibility: row.visibility || "public"
      }))
    },
    checks,
    history
  };
}

function validateAppRegistryInput(appId, input = {}) {
  const displayName = normalizeAppRegistryText(input.displayName, 160);
  const businessGroup = normalizeAppRegistryText(input.businessGroup || "general", 60).toLowerCase() || "general";
  const deliveryType = normalizeAppRegistryDeliveryType(input.deliveryType);
  const webUrl = normalizeAppRegistryUrl(input.webUrl);
  const pricingUrl = normalizeAppRegistryUrl(input.pricingUrl);
  const downloadUrl = normalizeAppRegistryUrl(input.downloadUrl);
  const manifestUrl = normalizeAppRegistryUrl(input.manifestUrl);
  const releaseNotesUrl = normalizeAppRegistryUrl(input.releaseNotesUrl);
  const updateChannel = normalizeAppRegistryText(input.updateChannel || "stable", 40).toLowerCase() || "stable";
  const ownerName = normalizeAppRegistryText(input.ownerName, 120);
  const supportUrl = normalizeAppRegistryUrl(input.supportUrl);
  const supportSlaHours = Math.max(1, Math.min(168, Number(input.supportSlaHours) || 24));
  const publicReady = input.publicReady === true || String(input.publicReady || "").toLowerCase() === "true";
  const checklistNote = normalizeAppRegistryText(input.checklistNote, 500);
  const errors = [];

  if (!displayName) {
    errors.push({ field: "displayName", message: "Vui lòng nhập tên hiển thị cho app" });
  }
  const urls = [
    ["webUrl", webUrl],
    ["pricingUrl", pricingUrl],
    ["downloadUrl", downloadUrl],
    ["manifestUrl", manifestUrl],
    ["releaseNotesUrl", releaseNotesUrl],
    ["supportUrl", supportUrl]
  ];
  for (const [field, value] of urls) {
    if (!isValidAppRegistryUrl(value)) {
      errors.push({ field, message: `Định dạng link chưa hợp lệ ở trường ${field}` });
    }
  }
  if (publicReady && !ownerName) {
    errors.push({ field: "ownerName", message: "App sẵn sàng mở bán phải có người phụ trách" });
  }
  if (publicReady && !supportUrl) {
    errors.push({ field: "supportUrl", message: "App sẵn sàng mở bán phải có link hỗ trợ khách" });
  }
  if ((deliveryType === "website" || deliveryType === "manifest_download") && !downloadUrl) {
    errors.push({ field: "downloadUrl", message: "App dạng web hoặc tải bộ cài phải có link tải cho khách" });
  }
  if (deliveryType === "manifest_download" && !manifestUrl) {
    errors.push({ field: "manifestUrl", message: "App có cập nhật bộ cài phải có link manifest update" });
  }

  if (errors.length > 0) {
    const error = createStoreError("Dữ liệu chưa đủ để lưu", 400);
    error.details = errors;
    throw error;
  }

  return {
    appId,
    displayName,
    businessGroup,
    deliveryType,
    webUrl,
    pricingUrl,
    downloadUrl,
    manifestUrl,
    releaseNotesUrl,
    updateChannel,
    ownerName,
    supportUrl,
    supportSlaHours,
    publicReady,
    checklistNote
  };
}

async function writeAppRegistryAuditLog({ appId, actorAdminId, actorUsername, action, beforeValue, afterValue }) {
  await pool.query(
    `INSERT INTO app_registry_audit_logs(app_id, actor_admin_id, actor_username, action, before_json, after_json)
     VALUES ($1, $2::uuid, $3, $4, $5::jsonb, $6::jsonb)`,
    [
      appId,
      actorAdminId || null,
      String(actorUsername || "").trim(),
      action,
      JSON.stringify(beforeValue || {}),
      JSON.stringify(afterValue || {})
    ]
  );
}

async function upsertAdminAppRegistry(appId, input = {}, actor = {}) {
  await ensureAppRegistryRows();
  const safeAppId = String(appId || "").trim();
  if (!safeAppId) {
    throw createStoreError("Thiếu appId", 400);
  }

  const beforeDetail = await getAdminAppRegistryDetail(safeAppId);
  const normalized = validateAppRegistryInput(safeAppId, input);

  const result = await pool.query(
    `UPDATE app_registry
     SET display_name = $2,
         business_group = $3,
         delivery_type = $4,
         web_url = $5,
         pricing_url = $6,
         download_url = $7,
         manifest_url = $8,
         release_notes_url = $9,
         update_channel = $10,
         owner_name = $11,
         support_url = $12,
         support_sla_hours = $13,
         public_ready = $14,
         checklist_note = $15,
         updated_at = NOW()
     WHERE app_id = $1
     RETURNING app_id`,
    [
      safeAppId,
      normalized.displayName,
      normalized.businessGroup,
      normalized.deliveryType,
      normalized.webUrl,
      normalized.pricingUrl,
      normalized.downloadUrl,
      normalized.manifestUrl,
      normalized.releaseNotesUrl,
      normalized.updateChannel,
      normalized.ownerName,
      normalized.supportUrl,
      normalized.supportSlaHours,
      normalized.publicReady,
      normalized.checklistNote
    ]
  );

  if (result.rowCount === 0) {
    throw createStoreError("Không tìm thấy app để cập nhật", 404);
  }

  const verification = await verifyAdminAppRegistryApp(safeAppId, { saveHistory: false });
  let openingBlocked = false;
  if (normalized.publicReady && Number(verification?.summary?.criticalCount || 0) > 0) {
    openingBlocked = true;
    await pool.query(
      `UPDATE app_registry
       SET public_ready = FALSE,
           updated_at = NOW()
       WHERE app_id = $1`,
      [safeAppId]
    );
  }

  const afterDetail = await getAdminAppRegistryDetail(safeAppId);
  await writeAppRegistryAuditLog({
    appId: safeAppId,
    actorAdminId: actor.id || null,
    actorUsername: actor.username || "",
    action: "app_registry_update",
    beforeValue: beforeDetail.app,
    afterValue: afterDetail.app
  });

  return {
    ...afterDetail,
    openingBlocked
  };
}

function buildAppRegistryCheck({ checkCode, severity, passed, message, detail = {} }) {
  return { checkCode, severity, passed, message, detail };
}

async function verifyAdminAppRegistryApp(appId, options = {}) {
  await ensureAppRegistryRows();
  const detail = await getAdminAppRegistryDetail(appId);
  const app = detail.app;
  const manifestRecord = readLocalAppManifest(app.appId);
  const localManifest = manifestRecord?.manifest || null;
  const checks = [];

  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_APP_EXISTS",
    severity: "critical",
    passed: true,
    message: "App đã tồn tại trong hệ thống"
  }));

  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_DELIVERY_TYPE_VALID",
    severity: "critical",
    passed: APP_REGISTRY_DELIVERY_TYPES.has(app.deliveryType),
    message: APP_REGISTRY_DELIVERY_TYPES.has(app.deliveryType)
      ? "Kiểu bàn giao app hợp lệ"
      : "Kiểu bàn giao app chưa hợp lệ"
  }));

  const activeProductOk = !app.publicReady || app.activeProductCount > 0;
  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_HAS_ACTIVE_PRODUCT",
    severity: "critical",
    passed: activeProductOk,
    message: activeProductOk
      ? "Đã có sản phẩm hoạt động hoặc app chưa bật mở bán"
      : "App đang bật sẵn sàng mở bán nhưng chưa có sản phẩm hoạt động"
  }));

  const requiresDownloadUrl = app.deliveryType === "website" || app.deliveryType === "manifest_download";
  const hasDownloadUrl = Boolean(String(app.downloadUrl || "").trim());
  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_DOWNLOAD_URL_REQUIRED",
    severity: "critical",
    passed: !requiresDownloadUrl || hasDownloadUrl,
    message: !requiresDownloadUrl || hasDownloadUrl
      ? "Đã có link tải cho khách"
      : "Chưa có link tải cho khách"
  }));

  let downloadReachable = true;
  if (requiresDownloadUrl && hasDownloadUrl) {
    const localArtifactPath = getLocalArtifactPathFromDownloadUrl(app.appId, app.downloadUrl);
    if (localArtifactPath) {
      // In private-artifacts mode, local binaries may be intentionally removed after sync to R2.
      downloadReachable = isR2PrivateArtifactsEnabledForRegistry() || fs.existsSync(localArtifactPath);
    } else {
      downloadReachable = isValidAppRegistryUrl(app.downloadUrl);
    }
  }
  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_DOWNLOAD_URL_REACHABLE",
    severity: "critical",
    passed: !requiresDownloadUrl || !hasDownloadUrl ? false : downloadReachable,
    message: !requiresDownloadUrl
      ? "App này không cần link tải trực tiếp"
      : (!hasDownloadUrl
        ? "Chưa có link tải để kiểm tra"
        : (downloadReachable ? "Link tải đang hợp lệ" : "Link tải đang lỗi hoặc file chưa tồn tại"))
  }));

  const requiresManifest = app.deliveryType === "manifest_download";
  const hasManifestUrl = Boolean(String(app.manifestUrl || "").trim());
  const manifestExists = requiresManifest ? Boolean(localManifest) : true;
  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_MANIFEST_EXISTS",
    severity: "critical",
    passed: !requiresManifest || (hasManifestUrl && manifestExists),
    message: !requiresManifest
      ? "App này không cần manifest update"
      : (hasManifestUrl && manifestExists ? "Đã có manifest update" : "Chưa tìm thấy manifest update cho app này")
  }));

  let manifestMatches = true;
  if (requiresManifest && hasManifestUrl) {
    const manifestUrl = String(app.manifestUrl || "").trim();
    manifestMatches = manifestUrl.includes(`/api/v1/app-updates/${app.appId}/manifest`);
  }
  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_MANIFEST_APP_MATCH",
    severity: "critical",
    passed: !requiresManifest || !hasManifestUrl ? false : manifestMatches,
    message: !requiresManifest
      ? "App này không cần kiểm tra khớp manifest"
      : (!hasManifestUrl
        ? "Chưa có link manifest để đối chiếu"
        : (manifestMatches ? "Manifest đang trỏ đúng app" : "Manifest đang trỏ sai app hoặc sai đường dẫn"))
  }));

  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_OWNER_REQUIRED",
    severity: "warning",
    passed: !app.publicReady || Boolean(String(app.ownerName || "").trim()),
    message: !app.publicReady || Boolean(String(app.ownerName || "").trim())
      ? "Đã có người phụ trách app"
      : "App sẵn sàng mở bán nhưng chưa có người phụ trách"
  }));

  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_SUPPORT_LINK_REQUIRED",
    severity: "warning",
    passed: !app.publicReady || Boolean(String(app.supportUrl || "").trim()),
    message: !app.publicReady || Boolean(String(app.supportUrl || "").trim())
      ? "Đã có link hỗ trợ khách"
      : "App sẵn sàng mở bán nhưng chưa có link hỗ trợ khách"
  }));

  checks.push(buildAppRegistryCheck({
    checkCode: "RULE_RELEASE_NOTES_OPTIONAL_WARN",
    severity: "warning",
    passed: Boolean(String(app.releaseNotesUrl || "").trim()),
    message: Boolean(String(app.releaseNotesUrl || "").trim())
      ? "Đã có link ghi chú cập nhật"
      : "Chưa có link ghi chú cập nhật, nên bổ sung để support dễ hơn"
  }));

  if (requiresManifest && localManifest?.downloadPath && hasDownloadUrl) {
    const manifestDownloadPath = String(localManifest.downloadPath || "").trim();
    const registryDownloadPath = String(app.downloadUrl || "").trim();
    const normalizedManifestDownload = manifestDownloadPath.startsWith("http") ? manifestDownloadPath : manifestDownloadPath;
    const passed = normalizedManifestDownload === registryDownloadPath;
    checks.push(buildAppRegistryCheck({
      checkCode: "RULE_MANIFEST_DOWNLOAD_MATCH",
      severity: "warning",
      passed,
      message: passed
        ? "Link tải trên registry khớp với manifest"
        : "Link tải trên registry đang lệch với downloadPath trong manifest"
    }));
  }

  const summary = summarizeAppRegistryChecks(checks);

  await pool.query(
    `UPDATE app_registry
     SET health_status = $2,
         health_score = $3,
         last_verified_at = NOW(),
         updated_at = NOW()
     WHERE app_id = $1`,
    [app.appId, summary.healthStatus, summary.score]
  );

  if (options.saveHistory !== false) {
    const batchId = crypto.randomUUID();
    for (const check of checks) {
      await pool.query(
        `INSERT INTO app_registry_checks(
           id, check_batch_id, app_id, check_code, severity, passed, message,
           detail_json, health_status, health_score, checked_at
         )
         VALUES (
           gen_random_uuid(), $1::uuid, $2, $3, $4, $5, $6,
           $7::jsonb, $8, $9, NOW()
         )`,
        [
          batchId,
          app.appId,
          check.checkCode,
          check.severity,
          check.passed,
          check.message,
          JSON.stringify(check.detail || {}),
          summary.healthStatus,
          summary.score
        ]
      );
    }
  }

  return {
    appId: app.appId,
    healthStatus: summary.healthStatus,
    healthScore: summary.score,
    checkedAt: new Date().toISOString(),
    summary: {
      criticalCount: summary.criticalCount,
      warningCount: summary.warningCount,
      passedCount: summary.passedCount,
      totalChecks: summary.totalChecks
    },
    checks
  };
}

async function verifyAllAdminAppRegistry(options = {}) {
  const rows = await queryAdminAppRegistryRows();
  const items = [];
  for (const app of rows) {
    if (options.onlyPublicReady === true && !app.publicReady) {
      continue;
    }
    const verified = await verifyAdminAppRegistryApp(app.appId, { saveHistory: options.saveHistory !== false });
    items.push({
      appId: app.appId,
      displayName: app.displayName,
      healthStatus: verified.healthStatus,
      healthScore: verified.healthScore,
      criticalCount: verified.summary.criticalCount,
      warningCount: verified.summary.warningCount
    });
  }

  return {
    checkedApps: items.length,
    greenApps: items.filter((item) => item.healthStatus === "green").length,
    yellowApps: items.filter((item) => item.healthStatus === "yellow").length,
    redApps: items.filter((item) => item.healthStatus === "red").length,
    items
  };
}

const PRODUCT_SALE_STATUSES = new Set(["live", "locked", "coming_soon"]);

function normalizeProductSaleStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PRODUCT_SALE_STATUSES.has(normalized) ? normalized : "live";
}

function toSafeMoneyValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, Math.round(parsed));
}

function resolveProductPricing(row) {
  const basePrice = Math.max(0, Number(row.price) || 0);
  const comparePriceRaw = toSafeMoneyValue(row.compare_price);
  const comparePrice = comparePriceRaw !== null ? comparePriceRaw : basePrice;
  const salePrice = toSafeMoneyValue(row.sale_price);
  const saleEnabled = row.sale_enabled === true;
  const allowCouponStack = row.allow_coupon_stack !== false;
  const hasDirectSale =
    saleEnabled
    && Number.isFinite(salePrice)
    && salePrice >= 0
    && comparePrice > salePrice;
  const effectivePrice = hasDirectSale ? salePrice : basePrice;

  return {
    basePrice,
    comparePrice,
    salePrice,
    saleEnabled,
    allowCouponStack,
    hasDirectSale,
    effectivePrice
  };
}

function mapProductRow(row) {
  const pricing = resolveProductPricing(row);
  return {
    id: row.id,
    appId: row.app_id,
    name: row.name,
    cycle: row.cycle,
    price: pricing.basePrice,
    basePrice: pricing.basePrice,
    comparePrice: pricing.comparePrice,
    salePrice: pricing.salePrice,
    effectivePrice: pricing.effectivePrice,
    saleEnabled: pricing.saleEnabled,
    allowCouponStack: pricing.allowCouponStack,
    hasDirectSale: pricing.hasDirectSale,
    currency: row.currency,
    credits: Number(row.credits),
    active: row.active,
    visibility: row.visibility,
    saleStatus: normalizeProductSaleStatus(row.sale_status),
    saleNote: String(row.sale_note || "").trim(),
    fulfillmentMode: normalizeFulfillmentMode(row.fulfillment_mode),
    licenseStrategy: normalizeLicenseStrategy(row.license_strategy),
    brandCode: row.brand_code || null,
    durationText: row.duration_text || null,
    deliveryEstimate: row.delivery_estimate || null,
    deliveryFieldSchema: row.delivery_field_schema || null,
    instructionTemplate: row.instruction_template || null,
    emailTemplate: row.email_template || null
  };
}

const FULFILLMENT_MODES = new Set(["auto_license", "manual_vendor", "manual_service", "quote_only"]);
const LICENSE_STRATEGIES = new Set(["legacy_hybrid", "inventory_key", "generated_machine"]);

function normalizeFulfillmentMode(value) {
  const normalized = String(value || "auto_license").trim().toLowerCase();
  return FULFILLMENT_MODES.has(normalized) ? normalized : "auto_license";
}

function validateFulfillmentMode(value) {
  return FULFILLMENT_MODES.has(String(value || "auto_license").trim().toLowerCase());
}

function normalizeLicenseStrategy(value) {
  const normalized = String(value || "legacy_hybrid").trim().toLowerCase();
  return LICENSE_STRATEGIES.has(normalized) ? normalized : "legacy_hybrid";
}

// Returns 'auto' for auto_license or NULL, 'manual' for manual_vendor/manual_service
function getFulfillmentCategory(value) {
  const mode = normalizeFulfillmentMode(value);
  if (mode === "manual_vendor" || mode === "manual_service") {
    return "manual";
  }
  return "auto";
}

async function getProductFulfillmentModeWithClient({ client, productId }) {
  const result = await client.query(
    `SELECT fulfillment_mode FROM products WHERE id = $1`,
    [productId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return normalizeFulfillmentMode(result.rows[0].fulfillment_mode);
}

async function createManualFulfillmentForOrderWithClient({ client, orderId, productId, fulfillmentMode }) {
  const result = await client.query(
    `INSERT INTO order_fulfillments(order_id, product_id, fulfillment_mode, status, delivery_data)
     VALUES ($1::uuid, $2, $3, 'waiting_manual_fulfillment', '{}'::jsonb)
     ON CONFLICT (order_id, product_id) DO NOTHING
     RETURNING id, order_id, product_id, fulfillment_mode, status, delivery_data,
               admin_note, customer_note, sent_at, sent_by, created_at, updated_at`,
    [orderId, productId, fulfillmentMode]
  );
  if (result.rowCount === 0) {
    // Already exists - fetch the existing record
    const existing = await client.query(
      `SELECT id, order_id, product_id, fulfillment_mode, status, delivery_data,
              admin_note, customer_note, sent_at, sent_by, created_at, updated_at
       FROM order_fulfillments
       WHERE order_id = $1::uuid AND product_id = $2`,
      [orderId, productId]
    );
    return { record: existing.rows[0], created: false };
  }
  return { record: result.rows[0], created: true };
}

function mapOrderFulfillment(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    fulfillmentMode: row.fulfillment_mode,
    status: row.status,
    deliveryData: row.delivery_data || {},
    adminNote: row.admin_note || null,
    customerNote: row.customer_note || null,
    sentAt: row.sent_at || null,
    sentBy: row.sent_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * List manual fulfillments with optional status filter.
 * Returns fulfillments joined with order + product + customer data.
 */
async function listManualFulfillments({ statusFilter = null, limit = 100, offset = 0 }) {
  const params = [limit, offset];
  let whereClause = `WHERE f.fulfillment_mode IN ('manual_vendor', 'manual_service')`;

  if (statusFilter && String(statusFilter).trim().toLowerCase() !== "all") {
    whereClause += ` AND f.status = $3`;
    params.push(String(statusFilter).trim().toLowerCase());
  }

  const query = `
    SELECT
      f.id,
      f.order_id,
      o.order_code,
      f.product_id,
      p.name        AS product_name,
      p.app_id      AS brand_code,
      f.fulfillment_mode,
      f.status,
      f.delivery_data,
      f.admin_note,
      f.customer_note,
      f.sent_at,
      f.sent_by,
      f.created_at,
      f.updated_at,
      c.full_name   AS customer_name,
      c.email       AS customer_email,
      o.amount      AS order_amount,
      o.currency    AS order_currency,
      o.paid_at     AS order_paid_at
    FROM order_fulfillments f
    JOIN orders o ON o.id = f.order_id
    JOIN products p ON p.id = f.product_id
    JOIN customers c ON c.id = o.customer_id
    ${whereClause}
    ORDER BY f.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, params);
  return result.rows.map(row => ({
    id: row.id,
    orderId: row.order_id,
    orderCode: row.order_code || null,
    productId: row.product_id,
    productName: row.product_name || null,
    brandCode: row.brand_code || null,
    fulfillmentMode: row.fulfillment_mode,
    status: row.status,
    deliveryData: row.delivery_data || {},
    adminNote: row.admin_note || null,
    customerNote: row.customer_note || null,
    sentAt: row.sent_at || null,
    sentBy: row.sent_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    orderAmount: row.order_amount ? Number(row.order_amount) : null,
    orderCurrency: row.order_currency || null,
    orderPaidAt: row.order_paid_at || null
  }));
}

async function getManualFulfillmentDetail({ fulfillmentId }) {
  if (!fulfillmentId) return null;
  const query = `
    SELECT
      f.id,
      f.order_id,
      o.order_code,
      f.product_id,
      p.name        AS product_name,
      p.app_id      AS brand_code,
      f.fulfillment_mode,
      f.status,
      f.delivery_data,
      f.admin_note,
      f.customer_note,
      f.sent_at,
      f.sent_by,
      f.created_at,
      f.updated_at,
      c.id          AS customer_id,
      c.full_name   AS customer_name,
      c.email       AS customer_email,
      o.amount      AS order_amount,
      o.currency    AS order_currency,
      o.paid_at     AS order_paid_at,
      o.created_at  AS order_created_at
    FROM order_fulfillments f
    JOIN orders o ON o.id = f.order_id
    JOIN products p ON p.id = f.product_id
    JOIN customers c ON c.id = o.customer_id
    WHERE f.id = $1
  `;
  const result = await pool.query(query, [String(fulfillmentId)]);
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    orderId: row.order_id,
    orderCode: row.order_code || null,
    productId: row.product_id,
    productName: row.product_name || null,
    brandCode: row.brand_code || null,
    fulfillmentMode: row.fulfillment_mode,
    status: row.status,
    deliveryData: row.delivery_data || {},
    adminNote: row.admin_note || null,
    customerNote: row.customer_note || null,
    sentAt: row.sent_at || null,
    sentBy: row.sent_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerId: row.customer_id,
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    orderAmount: row.order_amount ? Number(row.order_amount) : null,
    orderCurrency: row.order_currency || null,
    orderPaidAt: row.order_paid_at || null,
    orderCreatedAt: row.order_created_at || null
  };
}

async function saveManualFulfillmentDraft({ fulfillmentId, deliveryData, adminNote, customerNote, targetStatus }) {
  if (!fulfillmentId) throw new Error("Missing fulfillmentId");

  const setClauses = [];
  const params = [];
  let paramIdx = 1;

  if (deliveryData !== undefined) {
    setClauses.push(`delivery_data = $${paramIdx}::jsonb`);
    params.push(JSON.stringify(deliveryData || {}));
    paramIdx++;
  }
  if (adminNote !== undefined) {
    setClauses.push(`admin_note = $${paramIdx}`);
    params.push(String(adminNote || "").slice(0, 2000));
    paramIdx++;
  }
  if (customerNote !== undefined) {
    setClauses.push(`customer_note = $${paramIdx}`);
    params.push(String(customerNote || "").slice(0, 2000));
    paramIdx++;
  }
  if (targetStatus !== undefined) {
    setClauses.push(`status = $${paramIdx}`);
    params.push(String(targetStatus));
    paramIdx++;
  }

  setClauses.push(`updated_at = NOW()`);

  if (!setClauses.length) return null;

  params.push(String(fulfillmentId));
  const query = `
    UPDATE order_fulfillments
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIdx}
    RETURNING id, order_id, fulfillment_mode, status, delivery_data,
             admin_note, customer_note, sent_at, sent_by, created_at, updated_at
  `;
  const result = await pool.query(query, params);
  if (!result.rows.length) return null;
  return mapOrderFulfillment(result.rows[0]);
}

function computeDiscountAmount(amount, percentOff) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safePercent = Math.max(0, Math.min(100, Number(percentOff) || 0));
  return Math.round((safeAmount * safePercent) / 100);
}

function mapUsageLog(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    customerId: row.customer_id,
    appId: row.app_id,
    featureKey: row.feature_key,
    units: Number(row.units),
    creditsConsumed: Number(row.credits_consumed),
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

function mapKeyDelivery(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    orderId: row.order_id,
    orderCode: row.order_code || null,
    productId: row.product_id,
    keyId: row.key_id,
    keyValue: row.key_value,
    deliveredToCustomer: row.delivered_to_customer,
    deliveryChannel: row.delivery_channel,
    deliveredPayload: row.delivered_payload,
    deliveredAt: row.delivered_at
  };
}

function mapAppLicense(row) {
  if (!row) {
    return null;
  }

  const activeLease = row.lease_client_id
    ? {
        licenseId: row.lease_license_id || row.id,
        customerId: row.lease_customer_id || row.customer_id,
        appId: row.lease_app_id || row.app_id,
        clientType: row.lease_client_type,
        clientId: row.lease_client_id,
        clientName: row.lease_client_name || null,
        acquiredAt: row.lease_acquired_at || null,
        lastSeenAt: row.lease_last_seen_at || null,
        expiresAt: row.lease_expires_at || null,
        metadata: row.lease_metadata || {}
      }
    : null;

  return {
    id: row.id,
    customerId: row.customer_id,
    appId: row.app_id,
    productId: row.product_id,
    orderId: row.order_id,
    planCode: row.plan_code,
    billingCycle: row.billing_cycle,
    licenseKey: row.license_key,
    status: row.status,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    deviceId: row.device_id,
    deviceName: row.device_name,
    lastVerifiedAt: row.last_verified_at,
    activationTokenHash: row.activation_token_hash || null,
    machineId: row.machine_id || null,
    machineName: row.machine_name || null,
    resetCount: Number(row.reset_count || 0),
    lastResetAt: row.last_reset_at || null,
    lastResetReason: row.last_reset_reason || null,
    lastResetByAdmin: row.last_reset_by_admin || null,
    metadata: row.metadata,
    activeLease,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRuntimeLease(row) {
  if (!row) {
    return null;
  }

  return {
    licenseId: row.license_id,
    customerId: row.customer_id,
    appId: row.app_id,
    clientType: row.client_type,
    clientId: row.client_id,
    clientName: row.client_name || null,
    acquiredAt: row.acquired_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    metadata: row.metadata || {}
  };
}

function normalizeRuntimeClientProfile(value) {
  return String(value || "").trim().toLowerCase() === "desktop" ? "desktop" : "web";
}

function normalizeRuntimeClientId(deviceId) {
  const normalized = String(deviceId || "").trim();
  return normalized || null;
}

async function findActiveLicenseRuntimeLease(licenseId) {
  const result = await pool.query(
    `SELECT license_id, customer_id, app_id, client_type, client_id, client_name,
            acquired_at, last_seen_at, expires_at, metadata
     FROM app_license_runtime_leases
     WHERE license_id = $1::uuid AND expires_at > NOW()
     LIMIT 1`,
    [licenseId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRuntimeLease(result.rows[0]);
}

async function claimOrRenewLicenseRuntimeLease({ license, clientId, clientType, clientName }) {
  const result = await pool.query(
    `INSERT INTO app_license_runtime_leases(
       license_id, customer_id, app_id, client_type, client_id, client_name,
       acquired_at, last_seen_at, expires_at, metadata
     )
     VALUES (
       $1::uuid, $2, $3, $4, $5, $6,
       NOW(), NOW(), NOW() + ($7::text || ' seconds')::interval, '{}'::jsonb
     )
     ON CONFLICT (license_id) DO UPDATE
     SET client_type = EXCLUDED.client_type,
         client_id = EXCLUDED.client_id,
         client_name = COALESCE(EXCLUDED.client_name, app_license_runtime_leases.client_name),
         last_seen_at = NOW(),
         expires_at = NOW() + ($7::text || ' seconds')::interval,
         metadata = COALESCE(app_license_runtime_leases.metadata, '{}'::jsonb)
     WHERE app_license_runtime_leases.expires_at <= NOW()
        OR app_license_runtime_leases.client_id = EXCLUDED.client_id
     RETURNING license_id, customer_id, app_id, client_type, client_id, client_name,
               acquired_at, last_seen_at, expires_at, metadata`,
    [
      license.id,
      license.customerId,
      license.appId,
      clientType,
      clientId,
      clientName || null,
      LICENSE_RUNTIME_LEASE_SECONDS,
    ]
  );

  if (result.rowCount > 0) {
    return { ok: true, lease: mapRuntimeLease(result.rows[0]) };
  }

  return {
    ok: false,
    concurrentUsage: true,
    activeLease: await findActiveLicenseRuntimeLease(license.id),
  };
}

async function releaseLicenseRuntimeLease({ licenseId, clientId = null }) {
  const params = [licenseId];
  let whereSql = "WHERE license_id = $1::uuid";

  if (clientId) {
    params.push(clientId);
    whereSql += ` AND client_id = $${params.length}`;
  }

  const result = await pool.query(
    `DELETE FROM app_license_runtime_leases
     ${whereSql}
     RETURNING license_id`,
    params
  );

  return result.rowCount > 0;
}

function generateReadableLicenseKey() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WSTL-${timePart}-${randomPart}`;
}

function computeLicenseExpiry(cycle) {
  if (cycle === "monthly") {
    const endAt = new Date();
    endAt.setMonth(endAt.getMonth() + 1);
    return endAt;
  }

  if (cycle === "yearly") {
    const endAt = new Date();
    endAt.setFullYear(endAt.getFullYear() + 1);
    return endAt;
  }

  return null;
}

function extendLicenseExpiryFromBase(cycle, baseDate) {
  if (cycle === "monthly") {
    const endAt = new Date(baseDate);
    endAt.setMonth(endAt.getMonth() + 1);
    return endAt;
  }

  if (cycle === "yearly") {
    const endAt = new Date(baseDate);
    endAt.setFullYear(endAt.getFullYear() + 1);
    return endAt;
  }

  return null;
}

async function getOrderAppLicense(orderId) {
  const result = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE order_id = $1::uuid`,
    [orderId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function issueAppLicenseForOrder({ client, order, product }) {
  const licenseStrategy = normalizeLicenseStrategy(product?.license_strategy || product?.licenseStrategy);
  if (licenseStrategy === "inventory_key") {
    return null;
  }

  const existedResult = await client.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            activation_token_hash, machine_id, machine_name,
            reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE order_id = $1::uuid`,
    [order.id]
  );

  if (existedResult.rowCount > 0) {
    return mapAppLicense(existedResult.rows[0]);
  }

  const expiresAt = computeLicenseExpiry(product.cycle);
  const orderMetadata = (order?.metadata && typeof order.metadata === "object") ? order.metadata : {};
  const cap01Config = getCap01ProductLicenseConfig(product?.id);
  const metadata = {
    source: "auto_after_paid",
    orderCode: order.order_code,
    cycle: product.cycle,
    licenseStrategy
  };

  if (cap01Config) {
    const orderSelectedGrades = normalizeStandardGrades(orderMetadata.selectedGrades);
    const fixedGrades = normalizeStandardGrades(cap01Config.fixedGrades);
    const selectedGrades = fixedGrades.length > 0 ? fixedGrades : orderSelectedGrades;
    metadata.planId = cap01Config.planId;
    metadata.packageName = cap01Config.packageName;
    metadata.basePlan = "standard";
    metadata.subjects = "all";
    metadata.grades = cap01Config.requiredGradeCount;
    metadata.profiles = cap01Config.profileLimit;
    metadata.allowedGrades = selectedGrades;
    metadata.standardGrades = selectedGrades;
    metadata.standardGradesRequiredCount = cap01Config.requiredGradeCount;
    metadata.features = {
      desktopOfflineTts: true,
      downloadByGrade: true,
      downloadAllGrades: selectedGrades.length >= 3,
      aiTutor: false,
    };
    metadata.license = {
      deviceLimit: 1,
      offlineGraceDays: 7,
    };
  }

  if (String(product.id || "").trim().toLowerCase() === "prod-study-year") {
    metadata.planId = "standard_1year_3grade";
    metadata.basePlan = "standard";
    metadata.subjects = "all";
    metadata.grades = 3;
    metadata.profiles = 3;
  }

  if (String(product.id || "").trim().toLowerCase() === "standard_1year_1grade") {
    metadata.planId = "standard_1year_1grade";
    metadata.basePlan = "standard";
    metadata.subjects = "all";
    metadata.grades = 1;
    metadata.profiles = 2;
  }

  if (String(product.id || "").trim().toLowerCase() === "cap01_beta_year_299") {
    metadata.planId = "beta_year_299";
    metadata.basePlan = "beta";
    metadata.appId = "app-study-12";
    metadata.allowedGrades = [];
    metadata.standardGrades = [];
    metadata.standardGradesRequiredCount = 1;
    metadata.features = {
      desktopOfflineTts: true,
      downloadByGrade: true,
      downloadAllGrades: false,
      aiTutor: false,
    };
    metadata.license = {
      deviceLimit: 1,
      offlineGraceDays: 7,
    };
  }

  const isBloomiaGeneratedLicense =
    licenseStrategy === "generated_machine" ||
    normalizeBloomiaAppId(product?.appId || product?.app_id) === BLOOMIA_APP_ID ||
    normalizeBloomiaAppId(order?.appId || order?.app_id) === BLOOMIA_APP_ID;
  const licensePlanCode = isBloomiaGeneratedLicense
    ? (String(product?.cycle || "").trim().toLowerCase() === "yearly"
      ? "yearly"
      : String(product?.cycle || "").trim().toLowerCase() === "one_time"
        ? "lifetime"
        : String(product?.cycle || "").trim().toLowerCase() || product.id)
    : product.id;

  if (isBloomiaGeneratedLicense) {
    const existingBloomiaResult = await client.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              activation_token_hash, machine_id, machine_name,
              reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE customer_id = $1
         AND app_id = $2
         AND status <> 'revoked'
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [order.customer_id, order.app_id]
    );

    if (existingBloomiaResult.rowCount > 0) {
      const existingBloomia = existingBloomiaResult.rows[0];
      const previousExpiresAt = existingBloomia.expires_at ? new Date(existingBloomia.expires_at) : null;
      const renewalBase = previousExpiresAt && previousExpiresAt.getTime() > Date.now()
        ? previousExpiresAt
        : new Date();
      const renewedExpiresAt = extendLicenseExpiryFromBase(product.cycle, renewalBase);
      const renewalMetadata = {
        ...(existingBloomia.metadata && typeof existingBloomia.metadata === "object" ? existingBloomia.metadata : {}),
        source: "auto_after_paid",
        orderCode: order.order_code,
        cycle: product.cycle,
        licenseStrategy,
        renewal: {
          orderId: order.id,
          previousOrderId: existingBloomia.order_id || null,
          previousExpiresAt: previousExpiresAt ? previousExpiresAt.toISOString() : null,
          renewedAt: new Date().toISOString()
        }
      };

      const updateResult = await client.query(
        `UPDATE app_licenses
         SET order_id = $2::uuid,
             expires_at = $3,
             status = CASE WHEN status = 'revoked' THEN status ELSE 'active' END,
             last_verified_at = CASE WHEN last_verified_at IS NULL THEN NOW() ELSE last_verified_at END,
             metadata = $4::jsonb,
             updated_at = NOW()
         WHERE id = $1::uuid
         RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                   status, activated_at, expires_at, device_id, device_name, last_verified_at,
                   activation_token_hash, machine_id, machine_name,
                   reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
                   metadata, created_at, updated_at`,
        [
          existingBloomia.id,
          order.id,
          renewedExpiresAt ? renewedExpiresAt.toISOString() : null,
          JSON.stringify(renewalMetadata)
        ]
      );

      await client.query(
        `INSERT INTO app_license_renewals(
           license_id, customer_id, app_id, previous_order_id, new_order_id,
           previous_expires_at, new_expires_at
         )
         VALUES ($1::uuid, $2, $3, $4::uuid, $5::uuid, $6, $7)`,
        [
          existingBloomia.id,
          order.customer_id,
          order.app_id,
          existingBloomia.order_id || null,
          order.id,
          previousExpiresAt ? previousExpiresAt.toISOString() : null,
          renewedExpiresAt ? renewedExpiresAt.toISOString() : null
        ]
      );

      return mapAppLicense(updateResult.rows[0]);
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const licenseKey = isBloomiaGeneratedLicense
      ? generateBloomiaLicenseKey()
      : generateReadableLicenseKey();
    try {
      const inserted = await client.query(
        `INSERT INTO app_licenses(
           id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle,
           license_key, status, expires_at, activation_token_hash, machine_id, machine_name,
           reset_count, metadata
         )
         VALUES (
           gen_random_uuid(), $1, $2, $3, $4::uuid, $5, $6,
           $7, 'inactive', $8, NULL, NULL, NULL,
           0, $9::jsonb
         )
         RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                   status, activated_at, expires_at, device_id, device_name, last_verified_at,
                   activation_token_hash, machine_id, machine_name,
                   reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
                   metadata, created_at, updated_at`,
        [
          order.customer_id,
          order.app_id,
          order.product_id,
          order.id,
          licensePlanCode,
          product.cycle,
          licenseKey,
          expiresAt ? expiresAt.toISOString() : null,
          JSON.stringify(metadata)
        ]
      );

      return mapAppLicense(inserted.rows[0]);
    } catch (error) {
      const uniqueLicenseKeyConflict =
        error?.code === "23505" &&
        (String(error?.constraint || "").includes("license_key") ||
          String(error?.detail || "").includes("license_key"));
      if (!uniqueLicenseKeyConflict || attempt === 4) {
        throw error;
      }
    }
  }

  throw new Error("Khong the tao app license");
}

function computePeriod(cycle) {
  const startAt = new Date();
  const endAt = new Date(startAt);
  if (cycle === "monthly") {
    endAt.setMonth(endAt.getMonth() + 1);
  }
  if (cycle === "yearly") {
    endAt.setFullYear(endAt.getFullYear() + 1);
  }
  return { startAt, endAt };
}

async function getCatalog({ includeHidden = false, includeInactive = false } = {}) {
  const appsResult = await pool.query(
    "SELECT id, name, slug, status, description FROM apps ORDER BY created_at ASC"
  );
  const visibilityWhere = includeHidden ? "" : "AND visibility = 'public'";
  const activeWhere = includeInactive ? "" : "AND active = TRUE";
  const productsResult = await pool.query(
    `SELECT id, app_id, name, cycle, price, compare_price, sale_price, sale_enabled, allow_coupon_stack,
            currency, credits, active, visibility, sale_status, sale_note,
            fulfillment_mode, license_strategy, brand_code, duration_text, delivery_estimate,
            delivery_field_schema, instruction_template, email_template
     FROM products
     WHERE 1 = 1
       ${activeWhere}
       ${visibilityWhere}
     ORDER BY created_at ASC`
  );

  return {
    apps: appsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      description: row.description
    })),
    products: productsResult.rows.map(mapProductRow)
  };
}

async function getPublicCatalog() {
  const catalog = await getCatalog({ includeHidden: false });
  const filteredProducts = (catalog.products || []).filter((product) => {
    const productId = String(product?.id || "").trim().toLowerCase();
    if (isCap01ProductId(productId)) {
      return false;
    }

    const appId = String(product?.appId || "").trim().toLowerCase();
    if (isCap01AppId(appId)) {
      return false;
    }

    return true;
  });
  const filteredApps = (catalog.apps || []).filter((app) => !isCap01AppId(app?.id));
  return {
    ...catalog,
    products: filteredProducts,
    apps: filteredApps,
    cap01MovedNotice:
      filteredProducts.length === 0 &&
      ((catalog.products || []).length > 0 || (catalog.apps || []).some((app) => isCap01AppId(app?.id)))
  };
}

// BACKUP: was getCatalog({ includeHidden: true, includeInactive: true })
// Changed 2026-05-06: exclude inactive products (prod-study-* legacy plans deactivated)
async function getAdminCatalog() {
  const catalog = await getCatalog({ includeHidden: true, includeInactive: false });
  const filteredProducts = (catalog.products || []).filter((product) => {
    const productId = String(product?.id || "").trim().toLowerCase();
    if (isCap01ProductId(productId)) {
      return false;
    }
    const appId = String(product?.appId || "").trim().toLowerCase();
    if (isCap01AppId(appId)) {
      return false;
    }
    return true;
  });
  const filteredApps = (catalog.apps || []).filter((app) => !isCap01AppId(app?.id));
  return {
    ...catalog,
    products: filteredProducts,
    apps: filteredApps,
    cap01MovedNotice:
      filteredProducts.length === 0 &&
      ((catalog.products || []).length > 0 || (catalog.apps || []).some((app) => isCap01AppId(app?.id)))
  };
}

async function updateProductCardControl(productId, { saleStatus, saleNote, saleEnabled, salePrice, comparePrice, allowCouponStack }) {
  const safeProductId = String(productId || "").trim();
  if (!safeProductId) {
    throw createStoreError("Thiếu productId", 400);
  }

  if (isCap01ProductId(safeProductId)) {
    throw createStoreError("Sản phẩm Cấp 01 đã chuyển sang Học Chung Khối.", 410);
  }

  const normalizedSaleStatus = normalizeProductSaleStatus(saleStatus);
  const normalizedSaleNote = String(saleNote || "").trim().slice(0, 280);
  const safeSaleEnabled = saleEnabled === undefined || saleEnabled === null
    ? null
    : (saleEnabled === true || String(saleEnabled).toLowerCase() === "true");
  const safeAllowCouponStack = allowCouponStack === undefined || allowCouponStack === null
    ? null
    : (allowCouponStack === true || String(allowCouponStack).toLowerCase() === "true");
  const hasSalePriceInput = !(salePrice === undefined || salePrice === null || salePrice === "");
  const safeSalePrice = hasSalePriceInput ? toSafeMoneyValue(salePrice) : null;
  const hasComparePriceInput = !(comparePrice === undefined || comparePrice === null || comparePrice === "");
  const safeComparePrice = hasComparePriceInput ? toSafeMoneyValue(comparePrice) : null;

  if (safeSalePrice !== null && safeSalePrice < 0) {
    throw createStoreError("Giá sale không hợp lệ", 400);
  }
  if (hasSalePriceInput && safeSalePrice === null) {
    throw createStoreError("Giá sale không hợp lệ", 400);
  }
  if (safeComparePrice !== null && safeComparePrice < 0) {
    throw createStoreError("Giá gốc không hợp lệ", 400);
  }
  if (hasComparePriceInput && safeComparePrice === null) {
    throw createStoreError("Giá gốc không hợp lệ", 400);
  }

  const result = await pool.query(
    `UPDATE products
     SET sale_status = $2,
         sale_note = $3,
         sale_enabled = COALESCE($4, sale_enabled),
         sale_price = CASE WHEN $8 THEN $5 ELSE sale_price END,
         compare_price = CASE WHEN $9 THEN COALESCE($6, price) ELSE compare_price END,
         allow_coupon_stack = COALESCE($7, allow_coupon_stack),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, app_id, name, cycle, price, compare_price, sale_price, sale_enabled, allow_coupon_stack,
               currency, credits, active, visibility, sale_status, sale_note`,
    [
      safeProductId,
      normalizedSaleStatus,
      normalizedSaleNote,
      safeSaleEnabled,
      safeSalePrice,
      safeComparePrice,
      safeAllowCouponStack,
      hasSalePriceInput,
      hasComparePriceInput
    ]
  );

  if (result.rowCount === 0) {
    throw createStoreError("Không tìm thấy sản phẩm để cập nhật", 404);
  }

  return mapProductRow(result.rows[0]);
}

async function updateProductFulfillmentConfig(productId, input = {}) {
  const safeProductId = String(productId || "").trim();
  if (!safeProductId) {
    throw createStoreError("Thiếu productId", 400);
  }

  const safeFulfillmentMode = input.fulfillmentMode !== undefined
    ? normalizeFulfillmentMode(input.fulfillmentMode)
    : null;
  const safeLicenseStrategy = input.licenseStrategy !== undefined
    ? normalizeLicenseStrategy(input.licenseStrategy)
    : null;
  const safeBrandCode = input.brandCode !== undefined
    ? String(input.brandCode || "").trim().slice(0, 100) || null
    : null;
  const safeDurationText = input.durationText !== undefined
    ? String(input.durationText || "").trim().slice(0, 200) || null
    : null;
  const safeDeliveryEstimate = input.deliveryEstimate !== undefined
    ? String(input.deliveryEstimate || "").trim().slice(0, 200) || null
    : null;
  const safeDeliveryFieldSchema = input.deliveryFieldSchema !== undefined
    ? String(input.deliveryFieldSchema || "").trim().slice(0, 4000) || null
    : null;
  const safeInstructionTemplate = input.instructionTemplate !== undefined
    ? String(input.instructionTemplate || "").trim().slice(0, 4000) || null
    : null;
  const safeEmailTemplate = input.emailTemplate !== undefined
    ? String(input.emailTemplate || "").trim().slice(0, 4000) || null
    : null;

  if (safeFulfillmentMode !== null && !FULFILLMENT_MODES.has(safeFulfillmentMode)) {
    throw createStoreError("fulfillmentMode phải là một trong: auto_license, manual_vendor, manual_service, quote_only", 400);
  }
  if (safeLicenseStrategy !== null && !LICENSE_STRATEGIES.has(safeLicenseStrategy)) {
    throw createStoreError("licenseStrategy phải là một trong: legacy_hybrid, inventory_key, generated_machine", 400);
  }

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  if (safeFulfillmentMode !== null) {
    setClauses.push(`fulfillment_mode = $${paramIndex}`);
    params.push(safeFulfillmentMode);
    paramIndex++;
  }
  if (safeLicenseStrategy !== null) {
    setClauses.push(`license_strategy = $${paramIndex}`);
    params.push(safeLicenseStrategy);
    paramIndex++;
  }
  if (safeBrandCode !== null) {
    setClauses.push(`brand_code = $${paramIndex}`);
    params.push(safeBrandCode);
    paramIndex++;
  }
  if (safeDurationText !== null) {
    setClauses.push(`duration_text = $${paramIndex}`);
    params.push(safeDurationText);
    paramIndex++;
  }
  if (safeDeliveryEstimate !== null) {
    setClauses.push(`delivery_estimate = $${paramIndex}`);
    params.push(safeDeliveryEstimate);
    paramIndex++;
  }
  if (safeDeliveryFieldSchema !== null) {
    setClauses.push(`delivery_field_schema = $${paramIndex}`);
    params.push(safeDeliveryFieldSchema);
    paramIndex++;
  }
  if (safeInstructionTemplate !== null) {
    setClauses.push(`instruction_template = $${paramIndex}`);
    params.push(safeInstructionTemplate);
    paramIndex++;
  }
  if (safeEmailTemplate !== null) {
    setClauses.push(`email_template = $${paramIndex}`);
    params.push(safeEmailTemplate);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    throw createStoreError("Không có trường nào để cập nhật", 400);
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(safeProductId);

  const result = await pool.query(
    `UPDATE products
     SET ${setClauses.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, app_id, name, cycle, price, compare_price, sale_price, sale_enabled, allow_coupon_stack,
               currency, credits, active, visibility, sale_status, sale_note,
               fulfillment_mode, license_strategy, brand_code, duration_text, delivery_estimate,
               delivery_field_schema, instruction_template, email_template`,
    params
  );

  if (result.rowCount === 0) {
    throw createStoreError("Không tìm thấy sản phẩm để cập nhật", 404);
  }

  return mapProductRow(result.rows[0]);
}

async function applyDiscountToOrderWithClient({ client, orderId, discountCode }) {
  const normalizedCode = normalizeDiscountCode(discountCode);
  if (!normalizedCode) {
    throw createStoreError("Vui lòng nhập mã giảm giá", 400);
  }

  const orderResult = await client.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
            discount_amount, discount_percent, discount_code, discount_code_id,
            currency, status, created_at, paid_at
     FROM orders
     WHERE id = $1::uuid
     FOR UPDATE`,
    [orderId]
  );
  if (orderResult.rowCount === 0) {
    throw createStoreError("Order không tồn tại", 404);
  }

  const order = orderResult.rows[0];
  if (String(order.status || "").toLowerCase() !== "pending") {
    throw createStoreError("Chỉ áp dụng mã cho đơn hàng đang chờ thanh toán", 400);
  }

  const productResult = await client.query(
    `SELECT price, compare_price, sale_price, sale_enabled, allow_coupon_stack
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [order.product_id]
  );
  if (productResult.rowCount > 0) {
    const pricing = resolveProductPricing(productResult.rows[0]);
    if (pricing.hasDirectSale && !pricing.allowCouponStack) {
      throw createStoreError("Sản phẩm này đã giảm trực tiếp và không cho cộng thêm mã giảm giá", 400);
    }
  }

  const codeResult = await client.query(
    `SELECT id, code, percent_off, starts_at, ends_at, active, single_use, note,
            created_at, updated_at, created_by_admin_id, used_at, used_order_id
     FROM discount_codes
     WHERE UPPER(code) = $1
     FOR UPDATE`,
    [normalizedCode]
  );
  if (codeResult.rowCount === 0) {
    throw createStoreError("Mã giảm giá không tồn tại", 404);
  }

  const code = codeResult.rows[0];
  const now = Date.now();
  const startsAt = new Date(code.starts_at).getTime();
  const endsAt = new Date(code.ends_at).getTime();
  if (!code.active) {
    throw createStoreError("Mã giảm giá đang tắt", 400);
  }
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt > now || endsAt < now) {
    throw createStoreError("Mã giảm giá đã hết hạn hoặc chưa đến thời gian áp dụng", 400);
  }
  if (code.used_order_id && code.used_order_id !== order.id) {
    throw createStoreError("Mã giảm giá này đã được sử dụng", 400);
  }

  const reservedResult = await client.query(
    `SELECT id, order_code, status
     FROM orders
     WHERE discount_code_id = $1::uuid
       AND id <> $2::uuid
       AND status IN ('pending', 'paid')
     ORDER BY created_at DESC
     LIMIT 1`,
    [code.id, order.id]
  );
  if (reservedResult.rowCount > 0) {
    const reservedOrder = reservedResult.rows[0];
    throw createStoreError(
      reservedOrder.status === "paid"
        ? "Mã giảm giá này đã được sử dụng"
        : "Mã giảm giá này đang được giữ bởi một đơn khác",
      400
    );
  }

  const subtotalAmount = Number(order.subtotal_amount ?? order.amount ?? 0);
  const discountAmount = computeDiscountAmount(subtotalAmount, code.percent_off);
  const finalAmount = Math.max(0, subtotalAmount - discountAmount);
  const updatedResult = await client.query(
    `UPDATE orders
     SET subtotal_amount = $2,
         amount = $3,
         discount_amount = $4,
         discount_percent = $5,
         discount_code_id = $6::uuid,
         discount_code = $7,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
               discount_amount, discount_percent, discount_code, discount_code_id,
               currency, status, created_at, paid_at`,
    [order.id, subtotalAmount, finalAmount, discountAmount, Number(code.percent_off), code.id, code.code]
  );

  return {
    order: mapOrder(updatedResult.rows[0]),
    discountCode: mapDiscountCode({
      ...code,
      usage_status: "reserved",
      reserved_order_id: order.id,
      reserved_order_code: order.order_code
    })
  };
}

async function createOrder({ customerId, appId, productId, discountCode, selectedGrades = [], addonProductIds = [], metadata = {} }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const safeProductId = String(productId || "").trim();
    if (!safeProductId) {
      throw createStoreError("Thieu productId", 400);
    }
    const safeAppId = String(appId || "").trim();
    if (isCap01AppId(safeAppId) || isCap01ProductId(safeProductId)) {
      throw createStoreError("Sản phẩm Cấp 01 đã chuyển sang Học Chung Khối.", 410);
    }

    const normalizedAddonProductIds = Array.from(
      new Set(
        (Array.isArray(addonProductIds) ? addonProductIds : [])
          .map((id) => String(id || "").trim())
          .filter((id) => Boolean(id) && id !== safeProductId)
      )
    );

    const queryProductIds = [safeProductId, ...normalizedAddonProductIds];

    const productResult = await client.query(
      `SELECT id, app_id, name, cycle, price, compare_price, sale_price, sale_enabled, allow_coupon_stack,
              currency, credits, sale_status, sale_note
       FROM products
       WHERE app_id = $1 AND id = ANY($2::text[]) AND active = TRUE`,
      [safeAppId, queryProductIds]
    );

    const productById = new Map((productResult.rows || []).map((row) => [row.id, row]));
    const product = productById.get(safeProductId);
    if (!product) {
      throw createStoreError("Product khong ton tai hoac dang tat", 404);
    }

    const missingAddonProductIds = normalizedAddonProductIds.filter((id) => !productById.has(id));
    if (missingAddonProductIds.length > 0) {
      throw createStoreError("Addon khong ton tai hoac dang tat", 404);
    }

    const customerResult = await client.query("SELECT id FROM customers WHERE id = $1", [customerId]);
    if (customerResult.rowCount === 0) {
      throw createStoreError("Customer khong ton tai", 404);
    }

    const cap01Config = getCap01ProductLicenseConfig(product.id);
    const inputMetadata = metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : {};
    let orderMetadata = { ...inputMetadata };

    if (cap01Config) {
      const normalizedSelectedGrades = normalizeStandardGrades(selectedGrades);
      const fixedGrades = normalizeStandardGrades(cap01Config.fixedGrades);
      let finalGrades = normalizedSelectedGrades;

      if (fixedGrades.length > 0) {
        finalGrades = fixedGrades;
        if (normalizedSelectedGrades.length > 0 && !sameGradeSet(normalizedSelectedGrades, fixedGrades)) {
          throw createStoreError("Goi da co lop co dinh, khong duoc doi lop", 400);
        }
      }

      if (finalGrades.length !== cap01Config.requiredGradeCount) {
        throw createStoreError(`Vui long chon dung ${cap01Config.requiredGradeCount} lop truoc khi thanh toan`, 400);
      }

      orderMetadata = {
        selectedGrades: finalGrades,
        requiredGradeCount: cap01Config.requiredGradeCount,
        profileLimit: cap01Config.profileLimit,
        planId: cap01Config.planId,
        packageName: cap01Config.packageName
      };
    }

    const itemEntries = queryProductIds.map((id) => {
      const itemProduct = productById.get(id);
      const itemPricing = resolveProductPricing(itemProduct);
      const itemSaleStatus = normalizeProductSaleStatus(itemProduct.sale_status);
      return {
        id,
        product: itemProduct,
        pricing: itemPricing,
        saleStatus: itemSaleStatus,
        isAddon: id !== safeProductId
      };
    });

    const blockedItem = itemEntries.find(({ saleStatus }) => saleStatus !== "live");
    if (blockedItem) {
      const saleNote = String(blockedItem.product.sale_note || "").trim();
      const message =
        blockedItem.saleStatus === "coming_soon"
          ? saleNote || "Sản phẩm này đang ở trạng thái coming soon, chưa thể tạo đơn"
          : saleNote || "Sản phẩm này đang tạm khóa bán, chưa thể tạo đơn";
      throw createStoreError(message, 409);
    }

    const productEntry = itemEntries.find((entry) => !entry.isAddon);
    const pricing = productEntry.pricing;
    const saleStatus = normalizeProductSaleStatus(product.sale_status);
    if (saleStatus !== "live") {
      const saleNote = String(product.sale_note || "").trim();
      const message =
        saleStatus === "coming_soon"
          ? saleNote || "Sản phẩm này đang ở trạng thái coming soon, chưa thể tạo đơn"
          : saleNote || "Sản phẩm này đang tạm khóa bán, chưa thể tạo đơn";
      throw createStoreError(message, 409);
    }

    const hasNonStackableDirectSale = itemEntries.some(
      ({ pricing: itemPricing }) => itemPricing.hasDirectSale && !itemPricing.allowCouponStack
    );
    if (discountCode && hasNonStackableDirectSale) {
      throw createStoreError("Sản phẩm này đã giảm trực tiếp và không cho cộng thêm mã giảm giá", 400);
    }

    const addonEntries = itemEntries.filter((entry) => entry.isAddon);
    const addonSubtotal = addonEntries.reduce((sum, entry) => sum + entry.pricing.effectivePrice, 0);
    const subtotalAmount = pricing.effectivePrice + addonSubtotal;

    if (addonEntries.length > 0) {
      orderMetadata.addons = addonEntries.map((entry) => ({
        productId: entry.product.id,
        name: entry.product.name,
        cycle: entry.product.cycle,
        price: entry.pricing.basePrice,
        effectivePrice: entry.pricing.effectivePrice,
        comparePrice: entry.pricing.comparePrice,
        salePrice: entry.pricing.salePrice,
        saleEnabled: entry.pricing.saleEnabled,
        hasDirectSale: entry.pricing.hasDirectSale
      }));
    }

    let orderRow = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderCode = generateReadableOrderCode();
      try {
        const orderResult = await client.query(
          `INSERT INTO orders(
             id, order_code, customer_id, app_id, product_id,
             amount, subtotal_amount, discount_amount, discount_percent,
             currency, status, metadata
           )
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 0, 0, $7, 'pending', $8::jsonb)
           RETURNING id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
                    discount_amount, discount_percent, discount_code, discount_code_id, metadata,
                     currency, status, created_at, paid_at`,
          [
            orderCode,
            customerId,
            appId,
            safeProductId,
            subtotalAmount,
            subtotalAmount,
            product.currency,
            JSON.stringify(orderMetadata)
          ]
        );
        orderRow = orderResult.rows[0];
        break;
      } catch (error) {
        const uniqueOrderCodeConflict =
          error?.code === "23505" &&
          (String(error?.constraint || "").includes("order_code") ||
            String(error?.detail || "").includes("order_code"));
        if (!uniqueOrderCodeConflict || attempt === 4) {
          throw error;
        }
      }
    }

    if (discountCode) {
      const discounted = await applyDiscountToOrderWithClient({
        client,
        orderId: orderRow.id,
        discountCode
      });
      orderRow = {
        ...orderRow,
        ...discounted.order,
        order_code: discounted.order.orderCode,
        customer_id: discounted.order.customerId,
        app_id: discounted.order.appId,
        product_id: discounted.order.productId,
        subtotal_amount: discounted.order.subtotalAmount,
        discount_amount: discounted.order.discountAmount,
        discount_percent: discounted.order.discountPercent,
        discount_code: discounted.order.discountCode,
        metadata: orderRow.metadata || {},
        currency: discounted.order.currency,
        created_at: discounted.order.createdAt,
        paid_at: discounted.order.paidAt
      };
    }

    await client.query("COMMIT");

    return {
      order: mapOrder(orderRow),
      product: {
        id: product.id,
        appId: product.app_id,
        name: product.name,
        cycle: product.cycle,
        price: pricing.basePrice,
        effectivePrice: pricing.effectivePrice,
        comparePrice: pricing.comparePrice,
        salePrice: pricing.salePrice,
        saleEnabled: pricing.saleEnabled,
        allowCouponStack: pricing.allowCouponStack,
        hasDirectSale: pricing.hasDirectSale,
        currency: product.currency,
        credits: Number(product.credits)
      },
      addons: addonEntries.map((entry) => ({
        id: entry.product.id,
        appId: entry.product.app_id,
        name: entry.product.name,
        cycle: entry.product.cycle,
        price: entry.pricing.basePrice,
        effectivePrice: entry.pricing.effectivePrice,
        comparePrice: entry.pricing.comparePrice,
        salePrice: entry.pricing.salePrice,
        saleEnabled: entry.pricing.saleEnabled,
        allowCouponStack: entry.pricing.allowCouponStack,
        hasDirectSale: entry.pricing.hasDirectSale,
        currency: entry.product.currency,
        credits: Number(entry.product.credits)
      }))
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderById(orderId) {
  const result = await pool.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
            discount_amount, discount_percent, discount_code, discount_code_id,
            currency, status, created_at, paid_at
     FROM orders
     WHERE id = $1::uuid`,
    [orderId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapOrder(result.rows[0]);
}

async function getOrderByCode(orderCode) {
  const normalizedCode = String(orderCode || "").trim().toUpperCase();
  if (!normalizedCode) {
    return null;
  }

  const compactCode = normalizedCode.replace(/[^A-Z0-9]/g, "");

  const result = await pool.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
            discount_amount, discount_percent, discount_code, discount_code_id,
            currency, status, created_at, paid_at
     FROM orders
     WHERE order_code = $1 OR REPLACE(order_code, '-', '') = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedCode, compactCode]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapOrder(result.rows[0]);
}

async function getOrderKeyDelivery(orderId) {
  const deliveryResult = await pool.query(
    `SELECT d.id, d.order_id, o.order_code, d.product_id, d.key_id, d.delivered_to_customer, d.delivery_channel,
            d.delivered_payload, d.delivered_at, k.key_value
     FROM order_key_deliveries d
     JOIN product_keys k ON k.id = d.key_id
     JOIN orders o ON o.id = d.order_id
     WHERE d.order_id = $1::uuid`,
    [orderId]
  );

  if (deliveryResult.rowCount === 0) {
    return null;
  }

  return mapKeyDelivery(deliveryResult.rows[0]);
}

async function getOrderDetailsById(orderId) {
  const order = await getOrderById(orderId);
  if (!order) {
    return null;
  }

  const keyDelivery = order.status === "paid"
    ? await getOrderKeyDelivery(orderId)
    : null;
  return { order, keyDelivery };
}

async function applyDiscountToOrder({ orderId, discountCode }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const applied = await applyDiscountToOrderWithClient({ client, orderId, discountCode });
    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listDiscountCodes(limit = 200) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const result = await pool.query(
    `SELECT dc.id, dc.code, dc.percent_off, dc.starts_at, dc.ends_at, dc.active, dc.single_use,
            dc.note, dc.created_at, dc.updated_at, dc.created_by_admin_id, dc.used_at, dc.used_order_id,
            au.username AS created_by_username,
            used_order.order_code AS used_order_code,
            reserved_order.id AS reserved_order_id,
            reserved_order.order_code AS reserved_order_code,
            CASE
              WHEN dc.used_order_id IS NOT NULL THEN 'used'
              WHEN reserved_order.id IS NOT NULL THEN 'reserved'
              ELSE 'available'
            END AS usage_status
     FROM discount_codes dc
     LEFT JOIN admin_users au ON au.id = dc.created_by_admin_id
     LEFT JOIN orders used_order ON used_order.id = dc.used_order_id
     LEFT JOIN LATERAL (
       SELECT o.id, o.order_code
       FROM orders o
       WHERE o.discount_code_id = dc.id
         AND o.status = 'pending'
       ORDER BY o.created_at DESC
       LIMIT 1
     ) AS reserved_order ON TRUE
     ORDER BY dc.created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows.map(mapDiscountCode);
}

async function createDiscountCode({ code, percentOff, startsAt, endsAt, note, createdByAdminId }) {
  const normalizedCode = normalizeDiscountCode(code);
  const safePercentOff = Number(percentOff);
  const safeStartsAt = new Date(startsAt);
  const safeEndsAt = new Date(endsAt);
  const safeNote = String(note || "").trim();

  if (!normalizedCode || !/^[A-Z0-9_-]{4,40}$/.test(normalizedCode)) {
    throw createStoreError("Mã giảm giá chỉ gồm A-Z, số, gạch ngang hoặc gạch dưới, dài 4-40 ký tự", 400);
  }
  if (!Number.isInteger(safePercentOff) || safePercentOff <= 0 || safePercentOff >= 100) {
    throw createStoreError("Phần trăm giảm phải là số nguyên từ 1 đến 99", 400);
  }
  if (Number.isNaN(safeStartsAt.getTime()) || Number.isNaN(safeEndsAt.getTime()) || safeStartsAt >= safeEndsAt) {
    throw createStoreError("Khoảng thời gian áp dụng không hợp lệ", 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO discount_codes(
         id, code, percent_off, starts_at, ends_at, active, single_use,
         note, created_by_admin_id
       )
       VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE, TRUE, $5, $6::uuid)
       RETURNING id, code, percent_off, starts_at, ends_at, active, single_use,
                 note, created_at, updated_at, created_by_admin_id, used_at, used_order_id`,
      [
        normalizedCode,
        safePercentOff,
        safeStartsAt.toISOString(),
        safeEndsAt.toISOString(),
        safeNote || null,
        createdByAdminId || null
      ]
    );
    return mapDiscountCode(result.rows[0]);
  } catch (error) {
    const isConflict = error?.code === "23505";
    if (isConflict) {
      throw createStoreError("Mã giảm giá đã tồn tại", 409);
    }
    throw error;
  }
}

async function updateDiscountCodeActive({ discountCodeId, active }) {
  const result = await pool.query(
    `UPDATE discount_codes
     SET active = $2,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, code, percent_off, starts_at, ends_at, active, single_use,
               note, created_at, updated_at, created_by_admin_id, used_at, used_order_id`,
    [discountCodeId, Boolean(active)]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDiscountCode(result.rows[0]);
}

async function recordWebhookEvent(event) {
  const result = await pool.query(
    `INSERT INTO payment_webhook_events(event_id, order_id, provider, provider_transaction_id, status, payload)
     VALUES ($1, $2::uuid, $3, $4, $5, $6::jsonb)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING event_id`,
    [
      event.eventId,
      event.orderId,
      event.provider,
      event.providerTransactionId,
      event.status,
      JSON.stringify(event.payload)
    ]
  );

  return { duplicated: result.rowCount === 0 };
}

async function markOrderPaid({ orderId, provider, providerTransactionId, payload }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
              discount_amount, discount_percent, discount_code, discount_code_id,
              currency, status, metadata, created_at, paid_at
       FROM orders
       WHERE id = $1::uuid
       FOR UPDATE`,
      [orderId]
    );
    if (orderResult.rowCount === 0) {
      throw new Error("Order khong ton tai");
    }

    const orderRow = orderResult.rows[0];
    if (orderRow.discount_code_id) {
      const discountLock = await client.query(
        `SELECT id, used_order_id
         FROM discount_codes
         WHERE id = $1::uuid
         FOR UPDATE`,
        [orderRow.discount_code_id]
      );
      if (discountLock.rowCount === 0) {
        throw createStoreError("Mã giảm giá đã gắn với đơn không còn tồn tại", 400);
      }
      const discountRow = discountLock.rows[0];
      if (discountRow.used_order_id && discountRow.used_order_id !== orderId) {
        throw createStoreError("Mã giảm giá này đã được dùng cho đơn khác", 400);
      }
    }

    if (orderRow.status === "paid") {
      const existingDelivery = await getOrderKeyDelivery(orderId);
      const existingLicense = await getOrderAppLicense(orderId);
      await client.query("COMMIT");
      return {
        order: mapOrder(orderRow),
        keyDelivery: existingDelivery,
        appLicense: existingLicense,
        idempotent: true
      };
    }

    const txResult = await client.query(
      `INSERT INTO payment_transactions(id, order_id, provider, provider_transaction_id, amount, status, payload)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, 'paid', $5::jsonb)
       ON CONFLICT (provider_transaction_id) DO NOTHING
       RETURNING id`,
      [orderId, provider, providerTransactionId, orderRow.amount, JSON.stringify(payload)]
    );

    if (txResult.rowCount === 0) {
      const existingLicense = await getOrderAppLicense(orderId);
      await client.query("COMMIT");
      return { order: mapOrder(orderRow), appLicense: existingLicense, idempotent: true };
    }

    const paidOrderResult = await client.query(
      `UPDATE orders
       SET status = 'paid', paid_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
                 discount_amount, discount_percent, discount_code, discount_code_id,
                 currency, status, metadata, created_at, paid_at`,
      [orderId]
    );
    const paidOrder = paidOrderResult.rows[0];

    if (paidOrder.discount_code_id) {
      await client.query(
        `UPDATE discount_codes
         SET used_at = COALESCE(used_at, NOW()),
             used_order_id = COALESCE(used_order_id, $2::uuid),
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [paidOrder.discount_code_id, paidOrder.id]
      );
    }

    const productResult = await client.query(
      `SELECT id, app_id, cycle, credits, fulfillment_mode, license_strategy
       FROM products
       WHERE id = $1`,
      [paidOrder.product_id]
    );
    if (productResult.rowCount === 0) {
      throw new Error("Khong tim thay product cho order");
    }
    const product = productResult.rows[0];
    const fulfillmentCategory = getFulfillmentCategory(product.fulfillment_mode);
    const licenseStrategy = normalizeLicenseStrategy(product.license_strategy);

    // Guard: quote_only products should not enter paid flow
    if (normalizeFulfillmentMode(product.fulfillment_mode) === "quote_only") {
      throw createStoreError("San pham quote_only khong the duoc thanh toan truc tuyen", 400);
    }

    // NOTE: appLicense and keyDelivery handled below based on fulfillment_category

    let appLicense = null;
    let keyDelivery = null;

    if (fulfillmentCategory === "auto") {
      if (licenseStrategy !== "inventory_key") {
        appLicense = await issueAppLicenseForOrder({
          client,
          order: paidOrder,
          product
        });
      }

      if (product.cycle !== "one_time") {
        const { startAt, endAt } = computePeriod(product.cycle);
        await client.query(
          `INSERT INTO subscriptions(id, customer_id, app_id, product_id, status, start_at, end_at, renewal_mode)
           VALUES (gen_random_uuid(), $1, $2, $3, 'active', $4, $5, 'manual')
           ON CONFLICT (customer_id, app_id)
           DO UPDATE SET
             product_id = EXCLUDED.product_id,
             status = EXCLUDED.status,
             start_at = EXCLUDED.start_at,
             end_at = EXCLUDED.end_at,
             renewal_mode = EXCLUDED.renewal_mode`,
          [paidOrder.customer_id, paidOrder.app_id, product.id, startAt.toISOString(), endAt.toISOString()]
        );
        await client.query(
          `INSERT INTO entitlements(id, customer_id, app_id, feature_flags, valid_until, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3::jsonb, $4, NOW())
           ON CONFLICT (customer_id, app_id)
           DO UPDATE SET
             feature_flags = EXCLUDED.feature_flags,
             valid_until = EXCLUDED.valid_until,
             updated_at = NOW()`,
          [
            paidOrder.customer_id,
            paidOrder.app_id,
            JSON.stringify(["ai_tutor", "de_thi_thu", "bao_cao_tien_do"]),
            endAt.toISOString()
          ]
        );
      }

      await client.query(
        `INSERT INTO credit_wallets(customer_id, app_id, balance, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (customer_id, app_id)
         DO UPDATE SET
           balance = credit_wallets.balance + EXCLUDED.balance,
           updated_at = NOW()`,
        [paidOrder.customer_id, paidOrder.app_id, product.credits]
      );

      await client.query(
        `INSERT INTO credit_ledger(id, customer_id, app_id, change_amount, reason, order_id)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::uuid)`,
        [
          paidOrder.customer_id,
          paidOrder.app_id,
          product.credits,
          product.cycle === "one_time" ? "topup_purchase" : "subscription_grant",
          paidOrder.id
        ]
      );

      const deliveryResult = await client.query(
        `SELECT d.id, d.order_id, o.order_code, d.product_id, d.key_id, d.delivered_to_customer, d.delivery_channel,
                d.delivered_payload, d.delivered_at, k.key_value
         FROM order_key_deliveries d
         JOIN product_keys k ON k.id = d.key_id
         JOIN orders o ON o.id = d.order_id
         WHERE d.order_id = $1::uuid`,
        [paidOrder.id]
      );

      keyDelivery = deliveryResult.rowCount === 0 ? null : mapKeyDelivery(deliveryResult.rows[0]);

      if (!keyDelivery && licenseStrategy !== "generated_machine") {
        const keyResult = await client.query(
          `SELECT id, key_value
           FROM product_keys
           WHERE product_id = $1 AND status = 'available'
           ORDER BY created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1`,
          [paidOrder.product_id]
        );

        if (keyResult.rowCount > 0) {
          const selectedKey = keyResult.rows[0];

          await client.query(
            `UPDATE product_keys
             SET status = 'delivered', delivered_order_id = $1::uuid, updated_at = NOW()
             WHERE id = $2::uuid`,
            [paidOrder.id, selectedKey.id]
          );

          const insertedDelivery = await client.query(
            `INSERT INTO order_key_deliveries(
               id, order_id, product_id, key_id, delivered_to_customer, delivery_channel, delivered_payload
             )
             VALUES (gen_random_uuid(), $1::uuid, $2, $3::uuid, $4, 'portal_auto', $5::jsonb)
             ON CONFLICT (order_id) DO NOTHING
             RETURNING id, order_id, product_id, key_id, delivered_to_customer, delivery_channel, delivered_payload, delivered_at`,
            [
              paidOrder.id,
              paidOrder.product_id,
              selectedKey.id,
              paidOrder.customer_id,
              JSON.stringify({ keyValue: selectedKey.key_value, source: "auto_after_paid" })
            ]
          );

          if (insertedDelivery.rowCount > 0) {
            keyDelivery = {
              ...mapKeyDelivery(insertedDelivery.rows[0]),
              keyValue: selectedKey.key_value
            };
          } else {
            keyDelivery = await getOrderKeyDelivery(paidOrder.id);
          }
        }
      }
    } else {
      // manual_vendor or manual_service: create fulfillment record, skip auto license/key delivery
      await createManualFulfillmentForOrderWithClient({
        client,
        orderId: paidOrder.id,
        productId: paidOrder.product_id,
        fulfillmentMode: normalizeFulfillmentMode(product.fulfillment_mode)
      });
    }

    await client.query("COMMIT");
    return { order: mapOrder(paidOrder), keyDelivery, appLicense, idempotent: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listCustomerLicenses({ customerId, appId }) {
  const params = [customerId];
  let whereSql = "WHERE customer_id = $1";

  if (appId) {
    params.push(appId);
    whereSql += ` AND app_id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     ${whereSql}
     ORDER BY created_at DESC`,
    params
  );

  return result.rows.map(mapAppLicense);
}

async function activateCustomerLicense({ licenseId, customerId, deviceId, deviceName, clientId = null, clientType = "desktop" }) {
  const incomingDeviceId = normalizeRuntimeClientId(deviceId);
  const runtimeClientId = normalizeRuntimeClientId(clientId || incomingDeviceId);
  const normalizedClientProfile = normalizeRuntimeClientProfile(clientType);
  const runtimeClientName = String(deviceName || "").trim() || null;

  const existingResult = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [licenseId, customerId]
  );

  if (existingResult.rowCount === 0) {
    return null;
  }

  const existingLicense = mapAppLicense(existingResult.rows[0]);

  if (runtimeClientId) {
    const lease = await claimOrRenewLicenseRuntimeLease({
      license: existingLicense,
      clientId: runtimeClientId,
      clientType: normalizedClientProfile,
      clientName: runtimeClientName,
    });

    if (!lease.ok) {
      return {
        concurrentUsage: true,
        activeLease: lease.activeLease,
      };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = 'active',
         activated_at = COALESCE(activated_at, NOW()),
         last_verified_at = NOW(),
         device_id = CASE
           WHEN $5 = 'desktop' AND $3 IS NOT NULL THEN COALESCE(device_id, $3)
           ELSE device_id
         END,
         device_name = CASE
           WHEN $5 = 'desktop' AND $4 IS NOT NULL THEN COALESCE(device_name, $4)
           ELSE device_name
         END,
         updated_at = NOW()
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId, customerId, incomingDeviceId, runtimeClientName, normalizedClientProfile]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function verifyCustomerLicense({ licenseId, customerId, deviceId, deviceName, clientId = null, clientType = "desktop" }) {
  const incomingDeviceId = normalizeRuntimeClientId(deviceId);
  const runtimeClientId = normalizeRuntimeClientId(clientId || incomingDeviceId);
  const normalizedClientProfile = normalizeRuntimeClientProfile(clientType);
  const runtimeClientName = String(deviceName || "").trim() || null;

  const existingResult = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [licenseId, customerId]
  );

  if (existingResult.rowCount === 0) {
    return null;
  }

  const existingLicense = mapAppLicense(existingResult.rows[0]);

  if (runtimeClientId) {
    const lease = await claimOrRenewLicenseRuntimeLease({
      license: existingLicense,
      clientId: runtimeClientId,
      clientType: normalizedClientProfile,
      clientName: runtimeClientName,
    });

    if (!lease.ok) {
      return {
        concurrentUsage: true,
        activeLease: lease.activeLease,
      };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END,
         activated_at = CASE WHEN activated_at IS NULL THEN NOW() ELSE activated_at END,
         last_verified_at = NOW(),
         device_id = CASE
           WHEN $5 = 'desktop' AND $3 IS NOT NULL THEN COALESCE(device_id, $3)
           ELSE device_id
         END,
         device_name = CASE
           WHEN $5 = 'desktop' AND $4 IS NOT NULL THEN COALESCE(device_name, $4)
           ELSE device_name
         END,
         updated_at = NOW()
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId, customerId, incomingDeviceId, runtimeClientName, normalizedClientProfile]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function findAppLicenseByKey({ appId, licenseKey, customerId }) {
  const normalizedLicenseKey = String(licenseKey || "").trim().toUpperCase();
  const appIdCandidates = resolveAppIdCandidates(appId);
  if (!normalizedLicenseKey) {
    return null;
  }
  if (appIdCandidates.length === 0) {
    return null;
  }

  const params = [normalizedLicenseKey, appIdCandidates];
  let whereSql = "WHERE license_key = $1 AND app_id = ANY($2::text[]) AND status <> 'revoked'";

  if (customerId) {
    params.push(customerId);
    whereSql += ` AND customer_id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     ${whereSql}
     LIMIT 1`,
    params
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function findAppLicenseByKeyAdmin(licenseKey) {
  const normalizedKey = String(licenseKey || "").trim().toUpperCase();
  if (!normalizedKey) return null;

  const result = await pool.query(
    `SELECT al.id, al.customer_id, al.app_id, al.product_id, al.order_id,
            al.plan_code, al.billing_cycle, al.license_key,
            al.status, al.activated_at, al.expires_at, al.device_id, al.device_name,
            al.last_verified_at, al.activation_token_hash, al.machine_id, al.machine_name,
            al.reset_count, al.last_reset_at, al.last_reset_reason, al.last_reset_by_admin,
            al.metadata, al.created_at, al.updated_at,
            rtl.license_id AS lease_license_id,
            rtl.customer_id AS lease_customer_id,
            rtl.app_id AS lease_app_id,
            rtl.client_type AS lease_client_type,
            rtl.client_id AS lease_client_id,
            rtl.client_name AS lease_client_name,
            rtl.acquired_at AS lease_acquired_at,
            rtl.last_seen_at AS lease_last_seen_at,
            rtl.expires_at AS lease_expires_at,
            rtl.metadata AS lease_metadata
     FROM app_licenses al
     LEFT JOIN app_license_runtime_leases rtl
       ON rtl.license_id = al.id
      AND rtl.expires_at > NOW()
     WHERE al.license_key = $1
     LIMIT 1`,
    [normalizedKey]
  );

  if (result.rowCount === 0) return null;
  return mapAppLicense(result.rows[0]);
}

async function revokeAppLicenseAdmin(licenseId) {
  const result = await pool.query(
    `UPDATE app_licenses
     SET status = 'revoked',
         updated_at = NOW()
     WHERE id = $1::uuid AND status <> 'revoked'
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId]
  );
  if (result.rowCount === 0) return null;
  await releaseLicenseRuntimeLease({ licenseId });
  return mapAppLicense(result.rows[0]);
}

async function deactivateCustomerLicense({ licenseId, customerId, clientId = null, enforceRuntimeLease = false }) {
  if (enforceRuntimeLease) {
    const activeLease = await findActiveLicenseRuntimeLease(licenseId);
    if (activeLease && activeLease.clientId !== clientId) {
      return { leaseMismatch: true, activeLease };
    }
    if (activeLease && !clientId) {
      return { leaseMismatch: true, activeLease };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = 'inactive',
         device_id = NULL,
         device_name = NULL,
         updated_at = NOW()
     WHERE id = $1::uuid AND customer_id = $2 AND status <> 'revoked'
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId, customerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  await releaseLicenseRuntimeLease({ licenseId, clientId: clientId || null });

  return mapAppLicense(result.rows[0]);
}

async function verifyAppLicenseByKey({ appId, licenseKey, customerId, customerEmail, deviceId, deviceName, appVersion, clientProfile }) {
  const normalizedLicenseKey = String(licenseKey || "").trim().toUpperCase();
  const appIdCandidates = resolveAppIdCandidates(appId);
  if (!normalizedLicenseKey) {
    return null;
  }
  if (appIdCandidates.length === 0) {
    return null;
  }

  let resolvedCustomerId = String(customerId || "").trim() || null;
  const normalizedCustomerEmail = String(customerEmail || "").trim().toLowerCase();

  if (normalizedCustomerEmail) {
    const matchedCustomer = await findCustomerByEmail(normalizedCustomerEmail);
    if (!matchedCustomer?.id) {
      // Email không tồn tại trong DB → có thể email sai
      return { emailMismatch: true, reason: "email_not_found" };
    }

    if (resolvedCustomerId && resolvedCustomerId !== matchedCustomer.id) {
      return { emailMismatch: true, reason: "customer_id_conflict" };
    }

    resolvedCustomerId = matchedCustomer.id;
  }

  const existingLicense = await findAppLicenseByKey({
    appId,
    licenseKey: normalizedLicenseKey,
    ...(resolvedCustomerId ? { customerId: resolvedCustomerId } : {})
  });
  if (!existingLicense) {
    // Nếu đã resolve được customer từ email nhưng không tìm thấy key cho customer đó
    // → key thuộc customer khác (email mismatch)
    if (resolvedCustomerId && normalizedCustomerEmail) {
      return { emailMismatch: true, reason: "key_not_owned_by_email" };
    }
    return null;
  }

  const normalizedClientProfile = normalizeRuntimeClientProfile(clientProfile);
  const runtimeClientId = normalizeRuntimeClientId(deviceId);
  const runtimeClientName = String(deviceName || "").trim() || null;
  const runtimeAppVersion = String(appVersion || "").trim() || null;
  const normalizedProductId = String(existingLicense?.productId || "").trim().toLowerCase();
  const enforceSingleDeviceAcrossProfiles = normalizedProductId === "cap01_beta_year_299";

  if (
    (normalizedClientProfile === "desktop" || enforceSingleDeviceAcrossProfiles)
    && runtimeClientId
    && String(existingLicense?.deviceId || "").trim()
    && String(existingLicense.deviceId).trim() !== runtimeClientId
  ) {
    return {
      deviceLimitExceeded: true,
      existingDeviceId: String(existingLicense.deviceId || "").trim() || null,
      license: existingLicense,
    };
  }

  if (runtimeClientId) {
    const lease = await claimOrRenewLicenseRuntimeLease({
      license: existingLicense,
      clientId: runtimeClientId,
      clientType: normalizedClientProfile,
      clientName: runtimeClientName,
    });

    if (!lease.ok) {
      return {
        concurrentUsage: true,
        activeLease: lease.activeLease,
      };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END,
         activated_at = CASE WHEN activated_at IS NULL THEN NOW() ELSE activated_at END,
         last_verified_at = NOW(),
         device_id = CASE
           WHEN ($5::text = 'desktop' OR $7::boolean = true) AND $3::text IS NOT NULL THEN $3::text
           ELSE device_id
         END,
         device_name = CASE
           WHEN ($5::text = 'desktop' OR $7::boolean = true) AND $4::text IS NOT NULL THEN $4::text
           ELSE device_name
         END,
         metadata = CASE
           WHEN $5::text = 'desktop' OR $7::boolean = true THEN
             COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
               'deviceBinding',
               jsonb_strip_nulls(jsonb_build_object(
                 'deviceId', $3::text,
                 'deviceName', $4::text,
                 'appVersion', $6::text,
                 'lastSeenAt', NOW()::text
               ))
             )
           ELSE metadata
         END,
         updated_at = NOW()
     WHERE license_key = $1
       AND app_id = ANY($2::text[])
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [normalizedLicenseKey, appIdCandidates, runtimeClientId, runtimeClientName, normalizedClientProfile, runtimeAppVersion, enforceSingleDeviceAcrossProfiles]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

function buildBloomiaLicenseOfflineLease(license, { issuedAt = new Date() } = {}) {
  if (!license?.id || !license?.machineId) {
    return { offlineLease: null, offlineUntil: null };
  }

  const offlineUntilDate = computeBloomiaOfflineUntil({ expiresAt: license.expiresAt, now: issuedAt });
  const payload = buildBloomiaOfflineLeasePayload({
    appId: BLOOMIA_APP_ID,
    licenseId: license.id,
    machineId: license.machineId,
    status: license.status,
    expiresAt: license.expiresAt,
    offlineUntil: offlineUntilDate,
    issuedAt
  });

  if (!env.bloomiaLicensePrivateKey) {
    return {
      offlineLease: null,
      offlineUntil: payload.offlineUntil,
      payload
    };
  }

  return {
    offlineLease: signBloomiaOfflineLease(payload, env.bloomiaLicensePrivateKey),
    offlineUntil: payload.offlineUntil,
    payload
  };
}

function buildBloomiaLicenseResponse(license, { activationToken = null, issuedAt = new Date() } = {}) {
  const lease = buildBloomiaLicenseOfflineLease(license, { issuedAt });
  return {
    success: true,
    status: "active",
    data: {
      ...(activationToken ? { activationToken } : {}),
      license: {
        id: license.id,
        appId: BLOOMIA_APP_ID,
        planCode: license.planCode || license.productId || null,
        status: license.status,
        expiresAt: license.expiresAt || null,
        lastVerifiedAt: license.lastVerifiedAt || null,
        machineId: license.machineId || null,
        machineName: license.machineName || null
      },
      offlineLease: lease.offlineLease,
      offlineUntil: lease.offlineUntil
    }
  };
}

async function activateBloomiaLicense({ appId, licenseKey, machineId, deviceName, appVersion }) {
  const normalizedAppId = normalizeBloomiaAppId(appId);
  const normalizedLicenseKey = normalizeBloomiaLicenseKey(licenseKey);
  const normalizedMachineId = normalizeBloomiaMachineId(machineId);
  const normalizedDeviceName = normalizeBloomiaDeviceName(deviceName);
  const normalizedAppVersion = String(appVersion || "").trim() || null;

  if (normalizedAppId !== BLOOMIA_APP_ID) {
    return { ok: false, status: 400, code: "invalid_app", message: "Chi chap nhan appId app-bloomia-pos." };
  }
  if (!normalizedLicenseKey || !normalizedMachineId) {
    return { ok: false, status: 400, code: "bad_request", message: "Thieu appId, licenseKey hoac machineId." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lookup = await client.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              activation_token_hash, machine_id, machine_name,
              reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE license_key = $1 AND app_id = $2
       LIMIT 1
       FOR UPDATE`,
      [normalizedLicenseKey, BLOOMIA_APP_ID]
    );

    if (lookup.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, status: 404, code: "license_not_found", message: "Khong tim thay license Bloomia." };
    }

    const existing = lookup.rows[0];
    const status = String(existing.status || "").toLowerCase();
    if (status === "revoked" || status === "suspended") {
      await client.query("ROLLBACK");
      return { ok: false, status: 410, code: status, message: "License Bloomia da bi khoa hoac vo hieu." };
    }
    if (existing.expires_at && new Date(existing.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return { ok: false, status: 410, code: "expired", message: "License Bloomia da het han." };
    }

    if (existing.machine_id && String(existing.machine_id) !== normalizedMachineId) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, code: "machine_mismatch", message: "License da duoc khoa tren may khac." };
    }

    const activationToken = createBloomiaActivationToken();
    const activationTokenHash = hashBloomiaActivationToken(activationToken);
    const nextMetadata = {
      ...(existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
      bloomia: {
        appVersion: normalizedAppVersion,
        deviceName: normalizedDeviceName,
        machineId: normalizedMachineId,
        activatedAt: new Date().toISOString()
      }
    };

    const updateResult = await client.query(
      `UPDATE app_licenses
       SET status = 'active',
           activated_at = COALESCE(activated_at, NOW()),
           last_verified_at = NOW(),
           device_id = COALESCE(device_id, $2),
           device_name = COALESCE(device_name, $3),
           activation_token_hash = $4,
           machine_id = $2,
           machine_name = $3,
           metadata = $5::jsonb,
           updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                 status, activated_at, expires_at, device_id, device_name, last_verified_at,
                 activation_token_hash, machine_id, machine_name,
                 reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
                 metadata, created_at, updated_at`,
      [existing.id, normalizedMachineId, normalizedDeviceName, activationTokenHash, JSON.stringify(nextMetadata)]
    );

    const updated = mapAppLicense(updateResult.rows[0]);
    await client.query("COMMIT");
    return buildBloomiaLicenseResponse(updated, { activationToken });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

async function verifyBloomiaLicense({ appId, activationToken, machineId, deviceName, appVersion }) {
  const normalizedAppId = normalizeBloomiaAppId(appId);
  const normalizedToken = String(activationToken || "").trim();
  const normalizedMachineId = normalizeBloomiaMachineId(machineId);
  const normalizedDeviceName = normalizeBloomiaDeviceName(deviceName);
  const normalizedAppVersion = String(appVersion || "").trim() || null;

  if (normalizedAppId !== BLOOMIA_APP_ID) {
    return { ok: false, status: 400, code: "invalid_app", message: "Chi chap nhan appId app-bloomia-pos." };
  }
  if (!normalizedToken || !normalizedMachineId) {
    return { ok: false, status: 400, code: "bad_request", message: "Thieu activationToken hoac machineId." };
  }

  const tokenHash = hashBloomiaActivationToken(normalizedToken);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lookup = await client.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              activation_token_hash, machine_id, machine_name,
              reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE activation_token_hash = $1
         AND app_id = $2
       LIMIT 1
       FOR UPDATE`,
      [tokenHash, BLOOMIA_APP_ID]
    );

    if (lookup.rowCount === 0) {
      await client.query("ROLLBACK");
      return { ok: false, status: 401, code: "invalid", message: "Khong the xac thuc license Bloomia." };
    }

    const existing = lookup.rows[0];
    const status = String(existing.status || "").toLowerCase();
    if (status === "revoked" || status === "suspended") {
      await client.query("ROLLBACK");
      return { ok: false, status: 410, code: status, message: "License Bloomia da bi khoa hoac vo hieu." };
    }
    if (existing.expires_at && new Date(existing.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return { ok: false, status: 410, code: "expired", message: "License Bloomia da het han." };
    }
    if (String(existing.machine_id || "") !== normalizedMachineId) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, code: "machine_mismatch", message: "License dang gan voi may khac." };
    }

    const nextMetadata = {
      ...(existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
      bloomia: {
        appVersion: normalizedAppVersion,
        deviceName: normalizedDeviceName,
        machineId: normalizedMachineId,
        lastVerifiedAt: new Date().toISOString()
      }
    };

    const updateResult = await client.query(
      `UPDATE app_licenses
       SET status = 'active',
           last_verified_at = NOW(),
           device_name = COALESCE($3, device_name),
           metadata = $4::jsonb,
           updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                 status, activated_at, expires_at, device_id, device_name, last_verified_at,
                 activation_token_hash, machine_id, machine_name,
                 reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
                 metadata, created_at, updated_at`,
      [existing.id, normalizedMachineId, normalizedDeviceName, JSON.stringify(nextMetadata)]
    );

    const updated = mapAppLicense(updateResult.rows[0]);
    await client.query("COMMIT");

    return buildBloomiaLicenseResponse(updated);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

async function resetBloomiaLicenseMachine({ licenseId, adminId, reason }) {
  const safeLicenseId = String(licenseId || "").trim();
  if (!safeLicenseId) {
    throw createStoreError("Thiếu licenseId", 400);
  }

  const safeReason = String(reason || "").trim().slice(0, 500);
  const result = await pool.query(
    `UPDATE app_licenses
     SET machine_id = NULL,
         machine_name = NULL,
         activation_token_hash = NULL,
         device_id = NULL,
         device_name = NULL,
         status = CASE
           WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 'expired'
           WHEN status = 'revoked' THEN 'revoked'
           ELSE 'inactive'
         END,
         reset_count = COALESCE(reset_count, 0) + 1,
         last_reset_at = NOW(),
         last_reset_reason = $2,
         last_reset_by_admin = $3::uuid,
         updated_at = NOW()
     WHERE id = $1::uuid AND app_id = $4
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               activation_token_hash, machine_id, machine_name,
               reset_count, last_reset_at, last_reset_reason, last_reset_by_admin,
               metadata, created_at, updated_at`,
    [safeLicenseId, safeReason, adminId || null, BLOOMIA_APP_ID]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

function normalizeStandardGrades(grades) {
  if (!Array.isArray(grades)) {
    return [];
  }

  const unique = [];
  for (const item of grades) {
    const grade = Number(item);
    if (!Number.isInteger(grade)) {
      continue;
    }
    if (grade < 0 || grade > 12) {
      continue;
    }
    if (!unique.includes(grade)) {
      unique.push(grade);
    }
  }
  return unique.sort((a, b) => a - b);
}

function sameGradeSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

async function lockAppLicenseStandardGradesByKey({ appId, licenseKey, customerId, selectedGrades, requiredGradeCount }) {
  const normalizedLicenseKey = String(licenseKey || "").trim().toUpperCase();
  const normalizedAppId = String(appId || "").trim();
  const normalizedSelectedGrades = normalizeStandardGrades(selectedGrades);
  const normalizedRequired = Number(requiredGradeCount);

  if (!normalizedLicenseKey || !normalizedAppId) {
    return null;
  }
  if (!Number.isInteger(normalizedRequired) || normalizedRequired <= 0) {
    throw new Error("requiredGradeCount must be a positive integer");
  }
  if (normalizedSelectedGrades.length !== normalizedRequired) {
    throw new Error("selectedGrades does not match requiredGradeCount");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const params = [normalizedLicenseKey, normalizedAppId];
    let customerClause = "";
    if (customerId) {
      params.push(String(customerId).trim());
      customerClause = `AND customer_id = $${params.length}`;
    }

    const checkResult = await client.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE license_key = $1 AND app_id = $2
         ${customerClause}
         AND status <> 'revoked'
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1
       FOR UPDATE`,
      params
    );

    if (checkResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const row = checkResult.rows[0];
    const metadata = (row.metadata && typeof row.metadata === "object") ? row.metadata : {};
    const normalizedProductId = String(row.product_id || "").trim().toLowerCase();
    if (normalizedProductId === "cap01_beta_year_299" && normalizedRequired !== 1) {
      throw new Error("requiredGradeCount must be 1 for cap01_beta_year_299");
    }
    const existingGrades = normalizeStandardGrades(metadata.standardGrades);
    const existingRequired = Number(metadata.standardGradesRequiredCount || 0);

    if (existingGrades.length > 0) {
      if (!sameGradeSet(existingGrades, normalizedSelectedGrades)) {
        await client.query("ROLLBACK");
        return {
          gradeMismatch: true,
          lockedGrades: existingGrades,
          requiredGradeCount: existingRequired > 0 ? existingRequired : existingGrades.length,
          license: mapAppLicense(row)
        };
      }

      await client.query("COMMIT");
      return {
        gradeMismatch: false,
        lockedGrades: existingGrades,
        requiredGradeCount: existingRequired > 0 ? existingRequired : existingGrades.length,
        license: mapAppLicense(row)
      };
    }

    const nextMetadata = {
      ...metadata,
      standardGrades: normalizedSelectedGrades,
      standardGradesRequiredCount: normalizedRequired,
      allowedGrades: normalizedSelectedGrades,
      standardGradesLockedAt: new Date().toISOString()
    };

    const updateResult = await client.query(
      `UPDATE app_licenses
       SET metadata = $2::jsonb,
           updated_at = NOW(),
           last_verified_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                 status, activated_at, expires_at, device_id, device_name, last_verified_at,
                 metadata, created_at, updated_at`,
      [row.id, JSON.stringify(nextMetadata)]
    );

    await client.query("COMMIT");
    return {
      gradeMismatch: false,
      lockedGrades: normalizedSelectedGrades,
      requiredGradeCount: normalizedRequired,
      license: mapAppLicense(updateResult.rows[0])
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }
    throw error;
  } finally {
    client.release();
  }
}

async function consumeUsage({ customerId, appId, featureKey, creditsToConsume, units, requestId, metadata }) {
  if (!customerId || !appId || !featureKey) {
    throw new Error("customerId, appId va featureKey la bat buoc");
  }
  if (!Number.isInteger(creditsToConsume) || creditsToConsume <= 0) {
    throw new Error("creditsToConsume phai la so nguyen duong");
  }
  if (!Number.isInteger(units) || units <= 0) {
    throw new Error("units phai la so nguyen duong");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (requestId) {
      const existedResult = await client.query(
        `SELECT id, request_id, customer_id, app_id, feature_key, units, credits_consumed, status, metadata, created_at
         FROM ai_usage_logs
         WHERE request_id = $1`,
        [requestId]
      );

      if (existedResult.rowCount > 0) {
        const walletResult = await client.query(
          `SELECT customer_id, app_id, balance, updated_at
           FROM credit_wallets
           WHERE customer_id = $1 AND app_id = $2`,
          [customerId, appId]
        );
        await client.query("COMMIT");
        return {
          idempotent: true,
          usage: mapUsageLog(existedResult.rows[0]),
          wallet:
            walletResult.rowCount === 0
              ? null
              : {
                  customerId: walletResult.rows[0].customer_id,
                  appId: walletResult.rows[0].app_id,
                  balance: Number(walletResult.rows[0].balance),
                  updatedAt: walletResult.rows[0].updated_at
                }
        };
      }
    }

    const walletResult = await client.query(
      `SELECT customer_id, app_id, balance, updated_at
       FROM credit_wallets
       WHERE customer_id = $1 AND app_id = $2
       FOR UPDATE`,
      [customerId, appId]
    );

    if (walletResult.rowCount === 0) {
      throw new Error("Wallet khong ton tai");
    }

    const wallet = walletResult.rows[0];
    const currentBalance = Number(wallet.balance);
    if (currentBalance < creditsToConsume) {
      const rejectedResult = await client.query(
        `INSERT INTO ai_usage_logs(id, request_id, customer_id, app_id, feature_key, units, credits_consumed, status, metadata)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0, 'rejected_insufficient', $6::jsonb)
         RETURNING id, request_id, customer_id, app_id, feature_key, units, credits_consumed, status, metadata, created_at`,
        [requestId || null, customerId, appId, featureKey, units, JSON.stringify(metadata || {})]
      );

      await client.query("COMMIT");
      return {
        idempotent: false,
        usage: mapUsageLog(rejectedResult.rows[0]),
        wallet: {
          customerId: wallet.customer_id,
          appId: wallet.app_id,
          balance: currentBalance,
          updatedAt: wallet.updated_at
        },
        rejected: true,
        message: "Khong du credit"
      };
    }

    const usageResult = await client.query(
      `INSERT INTO ai_usage_logs(id, request_id, customer_id, app_id, feature_key, units, credits_consumed, status, metadata)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'consumed', $7::jsonb)
       RETURNING id, request_id, customer_id, app_id, feature_key, units, credits_consumed, status, metadata, created_at`,
      [requestId || null, customerId, appId, featureKey, units, creditsToConsume, JSON.stringify(metadata || {})]
    );

    await client.query(
      `UPDATE credit_wallets
       SET balance = balance - $1, updated_at = NOW()
       WHERE customer_id = $2 AND app_id = $3`,
      [creditsToConsume, customerId, appId]
    );

    await client.query(
      `INSERT INTO credit_ledger(id, customer_id, app_id, change_amount, reason, usage_log_id)
       VALUES (gen_random_uuid(), $1, $2, $3, 'usage_consume', $4::uuid)`,
      [customerId, appId, -creditsToConsume, usageResult.rows[0].id]
    );

    const nextWalletResult = await client.query(
      `SELECT customer_id, app_id, balance, updated_at
       FROM credit_wallets
       WHERE customer_id = $1 AND app_id = $2`,
      [customerId, appId]
    );

    await client.query("COMMIT");
    return {
      idempotent: false,
      usage: mapUsageLog(usageResult.rows[0]),
      wallet: {
        customerId: nextWalletResult.rows[0].customer_id,
        appId: nextWalletResult.rows[0].app_id,
        balance: Number(nextWalletResult.rows[0].balance),
        updatedAt: nextWalletResult.rows[0].updated_at
      },
      rejected: false
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getCustomerSnapshot(customerId) {
  const [customer, orders, subscriptions, entitlements, wallets, ledger, usageLogs, keyDeliveries, licenses] = await Promise.all([
    pool.query("SELECT id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at FROM customers WHERE id = $1", [customerId]),
    pool.query(
      `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
       FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, status, start_at, end_at, renewal_mode, created_at
       FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    ),
    pool.query(
      `SELECT id, customer_id, app_id, feature_flags, valid_until, updated_at
       FROM entitlements WHERE customer_id = $1 ORDER BY updated_at DESC`,
      [customerId]
    ),
    pool.query(
      `SELECT customer_id, app_id, balance, updated_at
       FROM credit_wallets WHERE customer_id = $1`,
      [customerId]
    ),
    pool.query(
      `SELECT id, customer_id, app_id, change_amount, reason, order_id, created_at
       FROM credit_ledger WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    ),
    pool.query(
      `SELECT id, request_id, customer_id, app_id, feature_key, units, credits_consumed, status, metadata, created_at
       FROM ai_usage_logs WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [customerId]
    ),
    pool.query(
      `SELECT d.id, d.order_id, o.order_code, d.product_id, d.key_id, d.delivered_to_customer, d.delivery_channel,
              d.delivered_payload, d.delivered_at, k.key_value
       FROM order_key_deliveries d
       JOIN product_keys k ON k.id = d.key_id
       JOIN orders o ON o.id = d.order_id
       WHERE d.delivered_to_customer = $1
       ORDER BY d.delivered_at DESC`,
      [customerId]
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    )
  ]);

  return {
    customer:
      customer.rowCount === 0
        ? null
        : {
            id: customer.rows[0].id,
            email: customer.rows[0].email,
            fullName: customer.rows[0].full_name,
            telegramChatId: customer.rows[0].telegram_chat_id || "",
            telegramUsername: customer.rows[0].telegram_username || "",
            telegramLinkedAt: customer.rows[0].telegram_linked_at || null
          },
    orders: orders.rows.map(mapOrder),
    subscriptions: subscriptions.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      appId: row.app_id,
      productId: row.product_id,
      status: row.status,
      startAt: row.start_at,
      endAt: row.end_at,
      renewalMode: row.renewal_mode,
      createdAt: row.created_at
    })),
    entitlements: entitlements.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      appId: row.app_id,
      featureFlags: row.feature_flags,
      validUntil: row.valid_until,
      updatedAt: row.updated_at
    })),
    wallets: wallets.rows.map((row) => ({
      customerId: row.customer_id,
      appId: row.app_id,
      balance: Number(row.balance),
      updatedAt: row.updated_at
    })),
    ledger: ledger.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      appId: row.app_id,
      change: Number(row.change_amount),
      reason: row.reason,
      orderId: row.order_id,
      createdAt: row.created_at
    })),
    usageLogs: usageLogs.rows.map(mapUsageLog)
    ,
    keyDeliveries: keyDeliveries.rows.map(mapKeyDelivery),
    licenses: licenses.rows.map(mapAppLicense)
  };
}

function generateTelegramLinkToken(customerId) {
  const randomPart = crypto.randomBytes(10).toString("hex");
  return `tg_${customerId}_${randomPart}`;
}

async function getCustomerTelegramProfile(customerId) {
  const result = await pool.query(
    `SELECT id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token
     FROM customers
     WHERE id = $1`,
    [customerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function ensureCustomerTelegramLinkToken(customerId) {
  const current = await getCustomerTelegramProfile(customerId);
  if (!current) {
    return null;
  }

  if (current.telegramLinkToken) {
    return current;
  }

  const nextToken = generateTelegramLinkToken(customerId);
  const updated = await pool.query(
    `UPDATE customers
     SET telegram_link_token = $2
     WHERE id = $1
     RETURNING id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token`,
    [customerId, nextToken]
  );

  const row = updated.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function refreshCustomerTelegramLinkToken(customerId) {
  const nextToken = generateTelegramLinkToken(customerId);
  const updated = await pool.query(
    `UPDATE customers
     SET telegram_link_token = $2
     WHERE id = $1
     RETURNING id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token`,
    [customerId, nextToken]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  const row = updated.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function findCustomerByTelegramLinkToken(token) {
  const normalized = String(token || "").trim();
  if (!normalized) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token
     FROM customers
     WHERE telegram_link_token = $1`,
    [normalized]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function linkCustomerTelegramChat({ customerId, chatId, username }) {
  const safeChatId = String(chatId || "").trim();
  if (!safeChatId) {
    throw new Error("chatId is required");
  }

  const safeUsername = String(username || "").trim();
  const updated = await pool.query(
    `UPDATE customers
     SET telegram_chat_id = $2,
         telegram_username = $3,
         telegram_linked_at = NOW(),
         telegram_link_token = NULL
     WHERE id = $1
     RETURNING id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at`,
    [customerId, safeChatId, safeUsername]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  const row = updated.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null
  };
}

async function getCustomerTelegramByCustomerId(customerId) {
  const result = await pool.query(
    `SELECT telegram_chat_id, telegram_username, telegram_linked_at
     FROM customers
     WHERE id = $1`,
    [customerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    chatId: result.rows[0].telegram_chat_id || "",
    username: result.rows[0].telegram_username || "",
    linkedAt: result.rows[0].telegram_linked_at || null
  };
}

async function getAdminDashboard() {
  const [kpiResult, latestOrders, latestTransactions, activeSubscriptions, walletStatsResult, topWalletsResult] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM apps) AS total_apps,
         (SELECT COUNT(*)::int FROM customers) AS total_customers,
         (SELECT COUNT(*)::int FROM orders WHERE status = 'paid') AS paid_orders,
         (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending_orders,
         (SELECT COALESCE(SUM(amount), 0)::bigint FROM orders WHERE status = 'paid') AS total_revenue`
    ),
    pool.query(
      `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
       FROM orders ORDER BY created_at DESC LIMIT 10`
    ),
    pool.query(
      `SELECT id, order_id, provider, provider_transaction_id, amount, status, verified_at
       FROM payment_transactions ORDER BY verified_at DESC LIMIT 10`
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, status, start_at, end_at, renewal_mode, created_at
       FROM subscriptions WHERE status = 'active' ORDER BY created_at DESC`
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(balance), 0)::bigint AS total_credit_balance,
         COUNT(*)::int AS total_wallets,
         COUNT(DISTINCT customer_id)::int AS customers_with_wallet
       FROM credit_wallets`
    ),
    pool.query(
      `SELECT w.customer_id, c.full_name, c.email, w.app_id, w.balance, w.updated_at
       FROM credit_wallets w
       JOIN customers c ON c.id = w.customer_id
       ORDER BY w.balance DESC, w.updated_at DESC
       LIMIT 10`
    )
  ]);

  const kpi = kpiResult.rows[0];
  const walletStats = walletStatsResult.rows[0] || {
    total_credit_balance: 0,
    total_wallets: 0,
    customers_with_wallet: 0
  };
  return {
    kpi: {
      totalApps: kpi.total_apps,
      totalCustomers: kpi.total_customers,
      paidOrders: kpi.paid_orders,
      pendingOrders: kpi.pending_orders,
      totalRevenue: Number(kpi.total_revenue),
      totalCreditBalance: Number(walletStats.total_credit_balance),
      totalWallets: Number(walletStats.total_wallets),
      customersWithWallet: Number(walletStats.customers_with_wallet)
    },
    latestOrders: latestOrders.rows.map(mapOrder),
    latestTransactions: latestTransactions.rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      provider: row.provider,
      providerTransactionId: row.provider_transaction_id,
      amount: Number(row.amount),
      status: row.status,
      verifiedAt: row.verified_at
    })),
    activeSubscriptions: activeSubscriptions.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      appId: row.app_id,
      productId: row.product_id,
      status: row.status,
      startAt: row.start_at,
      endAt: row.end_at,
      renewalMode: row.renewal_mode,
      createdAt: row.created_at
    })),
    topWallets: topWalletsResult.rows.map((row) => ({
      customerId: row.customer_id,
      fullName: row.full_name,
      email: row.email,
      appId: row.app_id,
      balance: Number(row.balance),
      updatedAt: row.updated_at
    }))
  };
}

async function findOrCreateCustomerByEmail(email, fullName) {
  const existing = await pool.query("SELECT id, email, full_name FROM customers WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    return { id: existing.rows[0].id, email: existing.rows[0].email, fullName: existing.rows[0].full_name };
  }
  const id = `cus-${Date.now()}`;
  const name = fullName || email.split("@")[0];
  await pool.query("INSERT INTO customers(id, email, full_name) VALUES ($1, $2, $3)", [id, email, name]);
  return { id, email, fullName: name };
}

async function createCustomerAccount(email, fullName) {
  const normalizedEmail = email.trim().toLowerCase();
  const existed = await pool.query("SELECT id, email, full_name FROM customers WHERE email = $1", [normalizedEmail]);
  if (existed.rowCount > 0) {
    return {
      customer: {
        id: existed.rows[0].id,
        email: existed.rows[0].email,
        fullName: existed.rows[0].full_name
      },
      created: false
    };
  }

  const id = `cus-${Date.now()}`;
  const name = fullName || normalizedEmail.split("@")[0];
  const createdResult = await pool.query(
    "INSERT INTO customers(id, email, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name",
    [id, normalizedEmail, name]
  );

  return {
    customer: {
      id: createdResult.rows[0].id,
      email: createdResult.rows[0].email,
      fullName: createdResult.rows[0].full_name
    },
    created: true
  };
}

async function findCustomerByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query(
    "SELECT id, email, full_name, password_hash FROM customers WHERE email = $1",
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash || ""
  };
}

async function findCustomerById(customerId) {
  const normalizedCustomerId = String(customerId || "").trim();
  if (!normalizedCustomerId) {
    return null;
  }

  const result = await pool.query(
    "SELECT id, email, full_name, password_hash FROM customers WHERE id = $1",
    [normalizedCustomerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash || ""
  };
}

async function registerCustomerByEmail(email, fullName, passwordHash) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await pool.query(
    "SELECT id, email, full_name, password_hash FROM customers WHERE email = $1",
    [normalizedEmail]
  );

  if (existing.rowCount > 0) {
    const row = existing.rows[0];
    if (row.password_hash) {
      return {
        customer: {
          id: row.id,
          email: row.email,
          fullName: row.full_name
        },
        created: false,
        passwordSet: false
      };
    }

    const nextName = (fullName || row.full_name || normalizedEmail.split("@")[0]).trim();
    const updated = await pool.query(
      `UPDATE customers
       SET full_name = $2,
           password_hash = $3
       WHERE id = $1
       RETURNING id, email, full_name`,
      [row.id, nextName, passwordHash]
    );

    return {
      customer: {
        id: updated.rows[0].id,
        email: updated.rows[0].email,
        fullName: updated.rows[0].full_name
      },
      created: false,
      passwordSet: true
    };
  }

  const id = `cus-${Date.now()}`;
  const name = (fullName || normalizedEmail.split("@")[0]).trim();
  const created = await pool.query(
    `INSERT INTO customers(id, email, full_name, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name`,
    [id, normalizedEmail, name, passwordHash]
  );

  return {
    customer: {
      id: created.rows[0].id,
      email: created.rows[0].email,
      fullName: created.rows[0].full_name
    },
    created: true,
    passwordSet: true
  };
}

async function updateCustomerPasswordByEmail(email, passwordHash) {
  const normalizedEmail = email.trim().toLowerCase();
  const updated = await pool.query(
    `UPDATE customers
     SET password_hash = $2
     WHERE email = $1
     RETURNING id, email, full_name`,
    [normalizedEmail, passwordHash]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  return {
    id: updated.rows[0].id,
    email: updated.rows[0].email,
    fullName: updated.rows[0].full_name
  };
}

async function ensureCustomerAuthSchema() {
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_sessions (
      session_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      device_id TEXT,
      device_name TEXT,
      app_id TEXT NOT NULL DEFAULT 'app-study-12',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ,
      revoke_reason TEXT
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_app_active
      ON customer_sessions(customer_id, app_id, revoked_at)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_sessions_last_seen
      ON customer_sessions(last_seen_at DESC)
  `);
}

async function createCustomerSession({ sessionId, customerId, deviceId, deviceName, appId = "app-study-12" }) {
  const safeSessionId = String(sessionId || "").trim();
  const safeCustomerId = String(customerId || "").trim();
  const safeDeviceId = String(deviceId || "").trim() || null;
  const safeDeviceName = String(deviceName || "").trim() || null;
  const safeAppId = String(appId || "app-study-12").trim() || "app-study-12";

  if (!safeSessionId || !safeCustomerId) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO customer_sessions(session_id, customer_id, device_id, device_name, app_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id)
     DO UPDATE SET
       customer_id = EXCLUDED.customer_id,
       device_id = EXCLUDED.device_id,
       device_name = EXCLUDED.device_name,
       app_id = EXCLUDED.app_id,
       last_seen_at = NOW(),
       revoked_at = NULL,
       revoke_reason = NULL
     RETURNING session_id, customer_id, device_id, device_name, app_id, created_at, last_seen_at, revoked_at, revoke_reason`,
    [safeSessionId, safeCustomerId, safeDeviceId, safeDeviceName, safeAppId]
  );

  return result.rowCount > 0 ? {
    sessionId: result.rows[0].session_id,
    customerId: result.rows[0].customer_id,
    deviceId: result.rows[0].device_id,
    deviceName: result.rows[0].device_name,
    appId: result.rows[0].app_id,
    createdAt: result.rows[0].created_at,
    lastSeenAt: result.rows[0].last_seen_at,
    revokedAt: result.rows[0].revoked_at,
    revokeReason: result.rows[0].revoke_reason,
  } : null;
}

async function getCustomerSessionById(sessionId) {
  const safeSessionId = String(sessionId || "").trim();
  if (!safeSessionId) {
    return null;
  }

  const result = await pool.query(
    `SELECT session_id, customer_id, device_id, device_name, app_id, created_at, last_seen_at, revoked_at, revoke_reason
     FROM customer_sessions
     WHERE session_id = $1
     LIMIT 1`,
    [safeSessionId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    sessionId: result.rows[0].session_id,
    customerId: result.rows[0].customer_id,
    deviceId: result.rows[0].device_id,
    deviceName: result.rows[0].device_name,
    appId: result.rows[0].app_id,
    createdAt: result.rows[0].created_at,
    lastSeenAt: result.rows[0].last_seen_at,
    revokedAt: result.rows[0].revoked_at,
    revokeReason: result.rows[0].revoke_reason,
  };
}

async function touchCustomerSession(sessionId) {
  const safeSessionId = String(sessionId || "").trim();
  if (!safeSessionId) {
    return null;
  }

  const result = await pool.query(
    `UPDATE customer_sessions
     SET last_seen_at = NOW()
     WHERE session_id = $1
       AND revoked_at IS NULL
     RETURNING session_id, customer_id, device_id, device_name, app_id, created_at, last_seen_at, revoked_at, revoke_reason`,
    [safeSessionId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    sessionId: result.rows[0].session_id,
    customerId: result.rows[0].customer_id,
    deviceId: result.rows[0].device_id,
    deviceName: result.rows[0].device_name,
    appId: result.rows[0].app_id,
    createdAt: result.rows[0].created_at,
    lastSeenAt: result.rows[0].last_seen_at,
    revokedAt: result.rows[0].revoked_at,
    revokeReason: result.rows[0].revoke_reason,
  };
}

async function revokeCustomerSessionById({ sessionId, reason = "logged_out" }) {
  const safeSessionId = String(sessionId || "").trim();
  const safeReason = String(reason || "logged_out").trim() || "logged_out";
  if (!safeSessionId) {
    return null;
  }

  const result = await pool.query(
    `UPDATE customer_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()),
         revoke_reason = COALESCE(revoke_reason, $2),
         last_seen_at = NOW()
     WHERE session_id = $1
     RETURNING session_id, customer_id, device_id, device_name, app_id, created_at, last_seen_at, revoked_at, revoke_reason`,
    [safeSessionId, safeReason]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    sessionId: result.rows[0].session_id,
    customerId: result.rows[0].customer_id,
    deviceId: result.rows[0].device_id,
    deviceName: result.rows[0].device_name,
    appId: result.rows[0].app_id,
    createdAt: result.rows[0].created_at,
    lastSeenAt: result.rows[0].last_seen_at,
    revokedAt: result.rows[0].revoked_at,
    revokeReason: result.rows[0].revoke_reason,
  };
}

async function revokeOtherCustomerSessions({ customerId, appId = "app-study-12", excludeSessionId = null, reason = "logged_out_by_new_device" }) {
  const safeCustomerId = String(customerId || "").trim();
  const safeAppId = String(appId || "app-study-12").trim() || "app-study-12";
  const safeExcludeSessionId = String(excludeSessionId || "").trim() || null;
  const safeReason = String(reason || "logged_out_by_new_device").trim() || "logged_out_by_new_device";

  if (!safeCustomerId) {
    return { revokedCount: 0 };
  }

  const params = [safeCustomerId, safeAppId, safeReason];
  let whereSql = "customer_id = $1 AND app_id = $2 AND revoked_at IS NULL";
  if (safeExcludeSessionId) {
    params.push(safeExcludeSessionId);
    whereSql += ` AND session_id <> $${params.length}`;
  }

  const result = await pool.query(
    `UPDATE customer_sessions
     SET revoked_at = NOW(),
         revoke_reason = $3,
         last_seen_at = NOW()
     WHERE ${whereSql}`,
    params
  );

  return { revokedCount: Number(result.rowCount || 0) };
}

async function listCustomers(limit = 100) {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 500 ? limit : 100;
  const result = await pool.query(
    `SELECT id, email, full_name, created_at
     FROM customers
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at
  }));
}

async function ensureAdminLoginSecuritySchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_login_guards (
      dimension TEXT NOT NULL,
      subject TEXT NOT NULL,
      fail_count INT NOT NULL DEFAULT 0,
      first_failed_at TIMESTAMPTZ,
      lock_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_login_guards_pk PRIMARY KEY (dimension, subject),
      CONSTRAINT admin_login_guards_dimension_check CHECK (dimension IN ('ip', 'username', 'pair'))
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_guards_lock_until
      ON admin_login_guards(lock_until)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_login_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      username TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      login_method TEXT NOT NULL,
      outcome TEXT NOT NULL,
      reason TEXT,
      admin_user_id UUID REFERENCES admin_users(id),
      role TEXT,
      requires_otp BOOLEAN NOT NULL DEFAULT FALSE,
      otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT admin_login_audits_method_check CHECK (login_method IN ('password', 'owner_key')),
      CONSTRAINT admin_login_audits_outcome_check CHECK (outcome IN ('success', 'failure', 'blocked', 'challenge'))
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_audits_attempted_at
      ON admin_login_audits(attempted_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_audits_username
      ON admin_login_audits(username)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_audits_ip
      ON admin_login_audits(ip_address)
  `);
}

function normalizeGuardValue(value) {
  return String(value || "").trim().toLowerCase();
}

function guardPairSubject(ipAddress, username) {
  return `${normalizeGuardValue(ipAddress)}|${normalizeGuardValue(username)}`;
}

async function getAdminLoginBlockState({ ipAddress, username }) {
  const safeIp = normalizeGuardValue(ipAddress) || "unknown";
  const safeUsername = normalizeGuardValue(username);
  const pair = guardPairSubject(safeIp, safeUsername || "_");

  const result = await pool.query(
    `SELECT dimension, lock_until
     FROM admin_login_guards
     WHERE lock_until IS NOT NULL
       AND lock_until > NOW()
       AND (
         (dimension = 'ip' AND subject = $1)
         OR (dimension = 'username' AND subject = $2)
         OR (dimension = 'pair' AND subject = $3)
       )
     ORDER BY lock_until DESC`,
    [safeIp, safeUsername, pair]
  );

  if (result.rowCount === 0) {
    return { blocked: false, retryAfterSeconds: 0, dimensions: [] };
  }

  const lockUntil = new Date(result.rows[0].lock_until).getTime();
  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000)),
    dimensions: result.rows.map((row) => row.dimension)
  };
}

async function upsertAdminLoginGuard({ dimension, subject, windowMs, maxAttempts, lockoutMs }) {
  if (!subject) {
    return;
  }

  const existing = await pool.query(
    `SELECT fail_count, first_failed_at, lock_until
     FROM admin_login_guards
     WHERE dimension = $1 AND subject = $2`,
    [dimension, subject]
  );

  const now = Date.now();
  if (existing.rowCount === 0) {
    const lockUntil = maxAttempts <= 1 ? new Date(now + lockoutMs) : null;
    await pool.query(
      `INSERT INTO admin_login_guards(dimension, subject, fail_count, first_failed_at, lock_until, updated_at)
       VALUES ($1, $2, 1, NOW(), $3, NOW())`,
      [dimension, subject, lockUntil]
    );
    return;
  }

  const row = existing.rows[0];
  const firstFailedAt = row.first_failed_at ? new Date(row.first_failed_at).getTime() : 0;
  const withinWindow = firstFailedAt > 0 && now - firstFailedAt <= windowMs;
  const nextFailCount = withinWindow ? Number(row.fail_count || 0) + 1 : 1;
  const nextFirstFailedAt = withinWindow ? new Date(firstFailedAt) : new Date(now);
  const currentLockUntil = row.lock_until ? new Date(row.lock_until).getTime() : 0;
  const nextLockUntil = nextFailCount >= maxAttempts
    ? new Date(now + lockoutMs)
    : currentLockUntil > now
      ? new Date(currentLockUntil)
      : null;

  await pool.query(
    `UPDATE admin_login_guards
     SET fail_count = $3,
         first_failed_at = $4,
         lock_until = $5,
         updated_at = NOW()
     WHERE dimension = $1 AND subject = $2`,
    [dimension, subject, nextFailCount, nextFirstFailedAt, nextLockUntil]
  );
}

async function registerAdminLoginFailureGuard({ ipAddress, username, windowMs, maxAttempts, lockoutMs }) {
  const safeIp = normalizeGuardValue(ipAddress) || "unknown";
  const safeUsername = normalizeGuardValue(username);

  await upsertAdminLoginGuard({
    dimension: "ip",
    subject: safeIp,
    windowMs,
    maxAttempts,
    lockoutMs
  });

  if (safeUsername) {
    await upsertAdminLoginGuard({
      dimension: "username",
      subject: safeUsername,
      windowMs,
      maxAttempts,
      lockoutMs
    });

    await upsertAdminLoginGuard({
      dimension: "pair",
      subject: guardPairSubject(safeIp, safeUsername),
      windowMs,
      maxAttempts,
      lockoutMs
    });
  }
}

async function clearAdminLoginFailureGuard({ ipAddress, username }) {
  const safeIp = normalizeGuardValue(ipAddress) || "unknown";
  const safeUsername = normalizeGuardValue(username);

  if (!safeUsername) {
    return;
  }

  await pool.query(
    `UPDATE admin_login_guards
     SET fail_count = 0,
         first_failed_at = NULL,
         lock_until = NULL,
         updated_at = NOW()
     WHERE (dimension = 'username' AND subject = $1)
        OR (dimension = 'pair' AND subject = $2)`,
    [safeUsername, guardPairSubject(safeIp, safeUsername)]
  );
}

async function recordAdminLoginAudit({
  username,
  ipAddress,
  userAgent,
  loginMethod,
  outcome,
  reason,
  adminUserId,
  role,
  requiresOtp,
  otpVerified,
  metadata
}) {
  await pool.query(
    `INSERT INTO admin_login_audits(
      username,
      ip_address,
      user_agent,
      login_method,
      outcome,
      reason,
      admin_user_id,
      role,
      requires_otp,
      otp_verified,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8, $9, $10, $11::jsonb)`,
    [
      normalizeGuardValue(username) || null,
      normalizeGuardValue(ipAddress) || "unknown",
      String(userAgent || "").slice(0, 500) || null,
      String(loginMethod || "password"),
      String(outcome || "failure"),
      reason ? String(reason).slice(0, 500) : null,
      adminUserId || null,
      role ? String(role) : null,
      Boolean(requiresOtp),
      Boolean(otpVerified),
      JSON.stringify(metadata || {})
    ]
  );
}

async function findAdminByUsername(username) {
  const result = await pool.query(
    `SELECT id, username, email, role, permissions, password_hash, is_active, created_by, created_at, last_login_at
     FROM admin_users
     WHERE username = $1`,
    [username]
  );
  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function findAdminById(adminId) {
  const result = await pool.query(
    `SELECT id, username, email, role, permissions, password_hash, is_active, created_by, created_at, last_login_at
     FROM admin_users
     WHERE id = $1::uuid`,
    [adminId]
  );
  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function markAdminLoginSuccess(adminId) {
  await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = $1::uuid", [adminId]);
}

async function createAdminUser({ username, email, passwordHash, role, permissions, createdBy }) {
  const result = await pool.query(
    `INSERT INTO admin_users(id, username, email, password_hash, role, permissions, created_by)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6::uuid)
     RETURNING id, username, email, role, permissions, is_active, created_by, created_at, last_login_at`,
    [username, email, passwordHash, role, JSON.stringify(permissions || []), createdBy || null]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function listAdminUsers() {
  const result = await pool.query(
    `SELECT id, username, email, role, permissions, is_active, created_by, created_at, last_login_at
     FROM admin_users
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  }));
}

async function countActiveOwners() {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM admin_users
     WHERE role = 'owner' AND is_active = TRUE`
  );
  return Number(result.rows[0]?.total || 0);
}

async function updateAdminUserById({ adminId, role, permissions, isActive }) {
  const result = await pool.query(
    `UPDATE admin_users
     SET role = $2,
         permissions = $3::jsonb,
         is_active = $4,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, username, email, role, permissions, is_active, created_by, created_at, last_login_at`,
    [adminId, role, JSON.stringify(permissions || []), isActive]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function updateAdminPasswordById({ adminId, passwordHash }) {
  const result = await pool.query(
    `UPDATE admin_users
     SET password_hash = $2,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, username, email, role, permissions, is_active, created_by, created_at, last_login_at`,
    [adminId, passwordHash]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function ensureRuntimeConfigSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS runtime_configs (
      config_key TEXT PRIMARY KEY,
      config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getRuntimeConfigValue(configKey) {
  const key = String(configKey || "").trim();
  if (!key) {
    return null;
  }

  await ensureRuntimeConfigSchema();
  const result = await pool.query(
    `SELECT config_value
     FROM runtime_configs
     WHERE config_key = $1`,
    [key]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0].config_value || null;
}

async function upsertRuntimeConfigValue(configKey, configValue) {
  const key = String(configKey || "").trim();
  if (!key) {
    throw new Error("config_key is required");
  }

  await ensureRuntimeConfigSchema();
  const payload = (configValue && typeof configValue === "object") ? configValue : {};
  const result = await pool.query(
    `INSERT INTO runtime_configs(config_key, config_value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (config_key)
     DO UPDATE SET
       config_value = EXCLUDED.config_value,
       updated_at = NOW()
     RETURNING config_value, updated_at`,
    [key, JSON.stringify(payload)]
  );

  return {
    value: result.rows[0]?.config_value || {},
    updatedAt: result.rows[0]?.updated_at || null
  };
}

async function searchCustomersByEmail(q, limit = 50) {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 200 ? limit : 50;
  const normalizedQuery = String(q || "").trim().toLowerCase();
  const pattern = `%${normalizedQuery}%`;
  const compact = normalizedQuery.replace(/[^a-z0-9]/g, "");
  const compactPattern = compact.length >= 4 ? `%${compact}%` : null;

  const result = await pool.query(
    `SELECT DISTINCT c.id, c.email, c.full_name, c.created_at
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     LEFT JOIN app_licenses al ON al.customer_id = c.id
     WHERE LOWER(c.email) LIKE $1
        OR LOWER(c.full_name) LIKE $1
        OR LOWER(c.id) LIKE $1
        OR LOWER(COALESCE(c.telegram_username, '')) LIKE $1
        OR LOWER(COALESCE(o.order_code, '')) LIKE $1
        OR LOWER(COALESCE(al.license_key, '')) LIKE $1
        OR ($2::text IS NOT NULL AND REPLACE(LOWER(COALESCE(o.order_code, '')), '-', '') LIKE $2)
        OR ($2::text IS NOT NULL AND REPLACE(LOWER(COALESCE(al.license_key, '')), '-', '') LIKE $2)
     ORDER BY c.created_at DESC
     LIMIT $3`,
    [pattern, compactPattern, safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at
  }));
}

async function updateCustomerById({ customerId, fullName }) {
  const safeName = String(fullName || "").trim();
  if (!safeName) {
    const err = new Error("fullName kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng");
    err.statusCode = 400;
    throw err;
  }
  const result = await pool.query(
    `UPDATE customers SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name, created_at`,
    [safeName, customerId]
  );
  if (result.rowCount === 0) {
    const err = new Error("Kh\u00f4ng t\u00ecm th\u1ea5y kh\u00e1ch h\u00e0ng");
    err.statusCode = 404;
    throw err;
  }
  const row = result.rows[0];
  return { id: row.id, email: row.email, fullName: row.full_name, createdAt: row.created_at };
}

async function deleteCustomerById(customerId) {
  const orderCheck = await pool.query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE customer_id = $1",
    [customerId]
  );
  const orderCount = Number(orderCheck.rows[0]?.cnt || 0);
  if (orderCount > 0) {
    const err = new Error(`Kh\u00f4ng th\u1ec3 x\u00f3a: kh\u00e1ch h\u00e0ng c\u00f3 ${orderCount} \u0111\u01a1n h\u00e0ng trong h\u1ec7 th\u1ed1ng`);
    err.statusCode = 409;
    throw err;
  }
  const result = await pool.query(
    "DELETE FROM customers WHERE id = $1 RETURNING id",
    [customerId]
  );
  if (result.rowCount === 0) {
    const err = new Error("Kh\u00f4ng t\u00ecm th\u1ea5y kh\u00e1ch h\u00e0ng");
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true, customerId };
}

async function manualGrantLicense({ customerEmail, productId, adminNote }) {
  const normalizedEmail = String(customerEmail || "").trim().toLowerCase();
  if (!normalizedEmail) {
    const err = new Error("customerEmail là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  const customerResult = await pool.query(
    "SELECT id, email FROM customers WHERE email = $1",
    [normalizedEmail]
  );
  if (customerResult.rowCount === 0) {
    const err = new Error(`Không tìm thấy khách hàng với email ${normalizedEmail}`);
    err.statusCode = 404;
    throw err;
  }
  const customer = customerResult.rows[0];

  const safeProductId = String(productId || "").trim();
  const productResult = await pool.query(
    `SELECT id, app_id, name, cycle, price, currency, credits, license_strategy
     FROM products
     WHERE id = $1 AND active = TRUE`,
    [safeProductId]
  );
  if (productResult.rowCount === 0) {
    const err = new Error(`Không tìm thấy sản phẩm "${safeProductId}" hoặc sản phẩm đã ngừng bán`);
    err.statusCode = 404;
    throw err;
  }
  const productRow = productResult.rows[0];
  const product = {
    id: productRow.id,
    appId: productRow.app_id,
    name: productRow.name,
    cycle: productRow.cycle,
    price: Number(productRow.price),
    currency: productRow.currency,
    credits: Number(productRow.credits),
    license_strategy: productRow.license_strategy
  };
  if (isCap01AppId(product.appId) || isCap01ProductId(product.id)) {
    const err = createStoreError(
      "Cấp 01 đã chuyển sang Học Chung Khối. Không tạo key mới tại web Ứng Dụng Thông Minh.",
      410
    );
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let orderRow = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderCode = generateReadableOrderCode();
      try {
        const orderResult = await client.query(
          `INSERT INTO orders(id, order_code, customer_id, app_id, product_id, amount, currency, status, paid_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, $5, 'paid', NOW())
           RETURNING id, order_code, customer_id, app_id, product_id, amount, currency, status, paid_at`,
          [orderCode, customer.id, product.appId, product.id, product.currency]
        );
        orderRow = orderResult.rows[0];
        break;
      } catch (error) {
        const uniqueConflict =
          error?.code === "23505" &&
          (String(error?.constraint || "").includes("order_code") ||
            String(error?.detail || "").includes("order_code"));
        if (!uniqueConflict || attempt === 4) {
          throw error;
        }
      }
    }

    const order = {
      id: orderRow.id,
      order_code: orderRow.order_code,
      customer_id: orderRow.customer_id,
      app_id: orderRow.app_id,
      product_id: orderRow.product_id
    };

    const license = await issueAppLicenseForOrder({ client, order, product });
    if (!license) {
      throw createStoreError("San pham nay khong cap app license tu dong", 400);
    }

    // Override source metadata so manual grants are distinguishable from auto grants
    await client.query(
      `UPDATE app_licenses
       SET metadata = metadata || $1::jsonb
       WHERE id = $2::uuid`,
      [JSON.stringify({ source: "manual_grant", adminNote: adminNote || "" }), license.id]
    );

    await client.query("COMMIT");

    return {
      licenseKey: license.licenseKey,
      orderId: order.id,
      orderCode: orderRow.order_code,
      customerId: customer.id,
      customerEmail: customer.email,
      appId: product.appId,
      productId: product.id,
      productName: product.name,
      planCode: product.id,
      billingCycle: product.cycle,
      expiresAt: license.expiresAt
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── Product key machine-lock activation (used by desktop apps that call the
//    /api/apps/:appId/activate endpoint with a Google Apps Script-compatible
//    request format) ──────────────────────────────────────────────────────────
async function activateProductKeyForMachine({ licenseKey, machineId, machineDisplayId, appName, appVersion, targetAppId }) {
  const safeKey     = String(licenseKey      || "").trim();
  const safeMachine = String(machineId       || "").trim();
  const safeDisplay = String(machineDisplayId|| "").trim();
  const safeAppId   = String(targetAppId     || "").trim();

  if (!safeKey || !safeMachine || !safeAppId) {
    return { ok: false, code: "bad_request", message: "Thiếu license_key, machine_id hoặc appId." };
  }

  const keyResult = await pool.query(
    `SELECT pk.id, pk.status, pk.machine_id, pk.machine_display_id, pk.machine_locked_at,
            c.full_name AS customer_name
     FROM product_keys pk
     JOIN products p ON p.id = pk.product_id
     LEFT JOIN order_key_deliveries okd ON okd.key_id = pk.id
     LEFT JOIN customers c ON c.id = okd.delivered_to_customer
     WHERE pk.key_value = $1
       AND p.app_id    = $2
     LIMIT 1`,
    [safeKey, safeAppId]
  );

  if (!keyResult.rows.length) {
    return { ok: false, code: "license_not_found", message: "Mã kích hoạt không hợp lệ hoặc không thuộc sản phẩm này." };
  }

  const row = keyResult.rows[0];

  if (row.machine_id) {
    if (row.machine_id !== safeMachine) {
      return {
        ok: false,
        code: "machine_mismatch",
        message: "Key đã được kích hoạt trên máy khác. Liên hệ hỗ trợ qua Zalo 0902964685 để chuyển máy."
      };
    }
    // Same machine – refresh last_seen_at
    await pool.query(
      `UPDATE product_keys SET machine_last_seen_at = NOW() WHERE id = $1`,
      [row.id]
    );
  } else {
    // First activation – lock to this machine
    await pool.query(
      `UPDATE product_keys
       SET machine_id           = $1,
           machine_display_id   = $2,
           machine_locked_at    = NOW(),
           machine_last_seen_at = NOW(),
           status               = 'delivered',
           updated_at           = NOW()
       WHERE id = $3`,
      [safeMachine, safeDisplay, row.id]
    );
  }

  return {
    ok: true,
    code: "activated",
    message: "Kích hoạt thành công.",
    status: "active",
    customer_name: String(row.customer_name || ""),
    machine_id: safeMachine
  };
}

module.exports = {
  getPublicCatalog,
  getAdminCatalog,
  updateProductCardControl,
  updateProductFulfillmentConfig,
  listManualFulfillments,
  activateProductKeyForMachine,
  activateBloomiaLicense,
  verifyBloomiaLicense,
  resetBloomiaLicenseMachine,
  createOrder,
  applyDiscountToOrder,
  getOrderById,
  getOrderByCode,
  getOrderDetailsById,
  markOrderPaid,
  consumeUsage,
  recordWebhookEvent,
  getOrderKeyDelivery,
  getCustomerSnapshot,
  getOrderAppLicense,
  listCustomerLicenses,
  activateCustomerLicense,
  verifyCustomerLicense,
  deactivateCustomerLicense,
  findAppLicenseByKey,
  findAppLicenseByKeyAdmin,
  verifyAppLicenseByKey,
  lockAppLicenseStandardGradesByKey,
  getAdminDashboard,
  findOrCreateCustomerByEmail,
  createCustomerAccount,
  findCustomerById,
  findCustomerByEmail,
  registerCustomerByEmail,
  updateCustomerPasswordByEmail,
  ensureCustomerAuthSchema,
  createCustomerSession,
  getCustomerSessionById,
  touchCustomerSession,
  revokeCustomerSessionById,
  revokeOtherCustomerSessions,
  getCustomerTelegramProfile,
  ensureCustomerTelegramLinkToken,
  refreshCustomerTelegramLinkToken,
  findCustomerByTelegramLinkToken,
  linkCustomerTelegramChat,
  getCustomerTelegramByCustomerId,
  listCustomers,
  ensureAdminLoginSecuritySchema,
  getAdminLoginBlockState,
  registerAdminLoginFailureGuard,
  clearAdminLoginFailureGuard,
  recordAdminLoginAudit,
  findAdminByUsername,
  findAdminById,
  markAdminLoginSuccess,
  createAdminUser,
  listAdminUsers,
  countActiveOwners,
  updateAdminUserById,
  updateAdminPasswordById,
  ensureRuntimeConfigSchema,
  getRuntimeConfigValue,
  upsertRuntimeConfigValue,
  searchCustomersByEmail,
  updateCustomerById,
  deleteCustomerById,
  manualGrantLicense,
  revokeAppLicenseAdmin,
  listProductKeySummary,
  listProductKeys,
  bulkImportProductKeys,
  deleteProductKey,
  listDiscountCodes,
  createDiscountCode,
  updateDiscountCodeActive,
  listAdminAppRegistry,
  getAdminAppRegistryDetail,
  upsertAdminAppRegistry,
  verifyAdminAppRegistryApp,
  verifyAllAdminAppRegistry,
  listAppRegistryCheckHistory,
  listWebDemoTemplates,
  getWebDemoTemplate,
  upsertWebDemoTemplate,
  createWebDemoLead,
  listWebDemoLeads,
  updateWebDemoLeadStatus,
  listPublicRouteRegistry,
  getPublicRouteRegistry,
  updatePublicRouteLock,
  getPublicRouteLocks,
  isPublicRouteLocked,
  getPublicRoutesForAdminUI,
  handleMauDemoLockedMigration,
  syncPublicRouteRegistry
};

async function listPublicRouteRegistry() {
  const result = await pool.query(`
    SELECT
      route_id,
      display_name,
      path,
      parent_id,
      lockable,
      sort_order,
      description,
      created_at,
      updated_at
    FROM public_route_registry
    ORDER BY sort_order ASC
  `);

  return result.rows.map((row) => ({
    routeId: row.route_id,
    displayName: row.display_name,
    path: row.path,
    parentId: row.parent_id,
    lockable: row.lockable,
    sortOrder: row.sort_order,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function getPublicRouteRegistry(routeId) {
  const safeRouteId = String(routeId || "").trim();
  if (!safeRouteId) {
    throw new Error("routeId là bắt buộc");
  }

  const result = await pool.query(`
    SELECT
      route_id,
      display_name,
      path,
      parent_id,
      lockable,
      sort_order,
      description,
      created_at,
      updated_at
    FROM public_route_registry
    WHERE route_id = $1
  `, [safeRouteId]);

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    routeId: row.route_id,
    displayName: row.display_name,
    path: row.path,
    parentId: row.parent_id,
    lockable: row.lockable,
    sortOrder: row.sort_order,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getPublicRouteLocks() {
  const result = await pool.query(`
    SELECT
      prl.route_id,
      prl.is_locked,
      prl.lock_scope,
      prl.lock_message,
      prl.locked_at,
      prl.locked_by,
      prr.display_name,
      prr.path,
      prr.parent_id,
      prr.lockable,
      prr.sort_order
    FROM public_route_locks prl
    LEFT JOIN public_route_registry prr ON prr.route_id = prl.route_id
    ORDER BY prr.sort_order ASC
  `);

  return result.rows.map((row) => ({
    routeId: row.route_id,
    isLocked: row.is_locked,
    lockScope: row.lock_scope,
    lockMessage: row.lock_message,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
    displayName: row.display_name,
    path: row.path,
    parentId: row.parent_id,
    lockable: row.lockable,
    sortOrder: row.sort_order
  }));
}

async function isPublicRouteLocked(routeId) {
  const safeRouteId = String(routeId || "").trim();
  if (!safeRouteId) {
    return false;
  }

  const result = await pool.query(`
    SELECT is_locked, lock_scope, parent_id
    FROM public_route_locks prl
    LEFT JOIN public_route_registry prr ON prr.route_id = prl.route_id
    WHERE prl.route_id = $1
  `, [safeRouteId]);

  if (result.rowCount === 0) {
    return false;
  }

  const row = result.rows[0];
  const currentLocked = row.is_locked;

  // If scope is 'branch' and parent is locked, this route is also locked
  if (!currentLocked && row.parent_id) {
    const parentLockResult = await pool.query(`
      SELECT is_locked, lock_scope
      FROM public_route_locks
      WHERE route_id = $1
    `, [row.parent_id]);

    if (parentLockResult.rowCount > 0) {
      const parentLock = parentLockResult.rows[0];
      if (parentLock.is_locked && parentLock.lock_scope === 'branch') {
        return true;
      }
    }
  }

  return currentLocked;
}

async function updatePublicRouteLock(routeId, isLocked, lockScope = 'exact', lockMessage = '', adminUsername = '') {
  const safeRouteId = String(routeId || "").trim();
  if (!safeRouteId) {
    throw new Error("routeId là bắt buộc");
  }

  const safeScope = ['exact', 'branch'].includes(lockScope) ? lockScope : 'exact';
  const safeMessage = String(lockMessage || "").trim().slice(0, 500);
  const safeUsername = String(adminUsername || "").trim() || 'system';

  // Verify route exists and is lockable
  const regResult = await pool.query(`
    SELECT lockable FROM public_route_registry WHERE route_id = $1
  `, [safeRouteId]);

  if (regResult.rowCount === 0) {
    throw new Error(`Route "${safeRouteId}" không tồn tại`);
  }

  if (!regResult.rows[0].lockable) {
    throw new Error(`Route "${safeRouteId}" không thể được khóa`);
  }

  const result = await pool.query(`
    UPDATE public_route_locks
    SET
      is_locked = $1,
      lock_scope = $2,
      lock_message = $3,
      locked_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
      locked_by = CASE WHEN $1 THEN $4 ELSE NULL END,
      updated_at = NOW()
    WHERE route_id = $5
    RETURNING route_id, is_locked, lock_scope, lock_message, locked_at, locked_by, updated_at
  `, [isLocked, safeScope, safeMessage || null, safeUsername, safeRouteId]);

  if (result.rowCount === 0) {
    throw new Error(`Không cập nhật được khóa cho route "${safeRouteId}"`);
  }

  const row = result.rows[0];
  return {
    routeId: row.route_id,
    isLocked: row.is_locked,
    lockScope: row.lock_scope,
    lockMessage: row.lock_message,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
    updatedAt: row.updated_at
  };
}

async function getPublicRoutesForAdminUI() {
  // Returns routes grouped by parent for tree UI rendering
  const result = await pool.query(`
    SELECT
      prr.route_id,
      prr.display_name,
      prr.path,
      prr.parent_id,
      prr.lockable,
      prr.sort_order,
      prl.is_locked,
      prl.lock_scope,
      prl.lock_message,
      prl.locked_at,
      prl.locked_by
    FROM public_route_registry prr
    LEFT JOIN public_route_locks prl ON prl.route_id = prr.route_id
    ORDER BY prr.sort_order ASC
  `);

  const nodes = result.rows.map((row) => ({
    routeId: row.route_id,
    displayName: row.display_name,
    path: row.path,
    parentId: row.parent_id,
    lockable: row.lockable,
    sortOrder: row.sort_order,
    isLocked: row.is_locked,
    lockScope: row.lock_scope,
    lockMessage: row.lock_message,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by
  }));

  // Group into tree structure
  const rootNodes = nodes.filter((n) => !n.parentId);
  for (const root of rootNodes) {
    root.children = nodes.filter((n) => n.parentId === root.routeId);
  }

  return rootNodes;
}

// Upsert route definitions into public_route_registry from code's canonical list.
// Called at startup so any new route added to CANONICAL_PUBLIC_ROUTES automatically
// appears in admin without requiring a DB migration.
async function syncPublicRouteRegistry(routeDefinitions) {
  const results = { upserted: 0, errors: [] };
  for (const route of routeDefinitions) {
    try {
      await pool.query(
        `INSERT INTO public_route_registry
           (route_id, display_name, path, parent_id, lockable, sort_order, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (route_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           path         = EXCLUDED.path,
           parent_id    = EXCLUDED.parent_id,
           sort_order   = EXCLUDED.sort_order,
           description  = EXCLUDED.description,
           updated_at   = NOW()`,
        [
          route.routeId,
          route.displayName,
          route.path,
          route.parentId || null,
          route.lockable !== false,
          route.sortOrder || 0,
          route.description || null
        ]
      );
      // Ensure a lock row exists (don't overwrite existing lock state)
      await pool.query(
        `INSERT INTO public_route_locks (route_id, is_locked, lock_scope)
         VALUES ($1, FALSE, 'exact')
         ON CONFLICT (route_id) DO NOTHING`,
        [route.routeId]
      );
      results.upserted++;
    } catch (err) {
      results.errors.push({ routeId: route.routeId, error: err.message });
    }
  }
  return results;
}

async function handleMauDemoLockedMigration() {
  // Backward compatibility: migrate old mauDemoLocked flag to new route locking system
  try {
    // Check if migration was already done
    const migrationCheck = await pool.query(`
      SELECT migration_state FROM public_route_locks_migration
      WHERE migration_key = 'mau_demo_locked_v1'
    `);

    if (migrationCheck.rowCount > 0) {
      const state = migrationCheck.rows[0].migration_state;
      if (state?.status === 'completed') {
        return { migrated: false, reason: 'Already migrated' };
      }
    }

    // Get old mauDemoLocked state from runtime-settings.json if available
    const settingsPath = path.join(__dirname, '..', '..', 'runtime-settings.json');
    let oldMauDemoLocked = false;
    let oldMauDemoMessage = '';

    try {
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        oldMauDemoLocked = Boolean(settings?.pageFlags?.mauDemoLocked);
        oldMauDemoMessage = String(settings?.pageFlags?.mauDemoMessage || '').trim();
      }
    } catch (e) {
      // File doesn't exist or is invalid JSON, continue with defaults
    }

    // If old flag was set, migrate it to new system
    if (oldMauDemoLocked && oldMauDemoMessage) {
      await updatePublicRouteLock('demo', true, 'exact', oldMauDemoMessage, 'migration-system');
    }

    // Mark migration as completed
    await pool.query(`
      INSERT INTO public_route_locks_migration (migration_key, migration_state)
      VALUES ('mau_demo_locked_v1', $1::jsonb)
      ON CONFLICT (migration_key)
      DO UPDATE SET migration_state = EXCLUDED.migration_state
    `, [JSON.stringify({ status: 'completed', migratedAt: new Date().toISOString() })]);

    return {
      migrated: oldMauDemoLocked,
      routeId: 'demo',
      oldMessage: oldMauDemoMessage
    };
  } catch (error) {
    console.error('Error in handleMauDemoLockedMigration:', error);
    return { migrated: false, error: error.message };
  }
}

async function listProductKeySummary() {
  const result = await pool.query(
    `SELECT p.id AS product_id, p.name AS product_name, p.app_id,
            COUNT(k.id) FILTER (WHERE k.status = 'available') AS available,
            COUNT(k.id) FILTER (WHERE k.status = 'delivered') AS delivered,
            COUNT(k.id) AS total
     FROM products p
     LEFT JOIN product_keys k ON k.product_id = p.id
     GROUP BY p.id, p.name, p.app_id
     ORDER BY p.app_id, p.id`
  );
  return result.rows
    .filter((row) => !isCap01AppId(row.app_id) && !isCap01ProductId(row.product_id))
    .map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      appId: r.app_id,
      available: Number(r.available),
      delivered: Number(r.delivered),
      total: Number(r.total)
    }));
}

async function listProductKeys(productId, { status = null, limit = 200, offset = 0 } = {}) {
  const productMeta = await pool.query(
    `SELECT id, app_id
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );
  const productRow = productMeta.rows[0];
  if (!productRow || isCap01AppId(productRow.app_id) || isCap01ProductId(productRow.id)) {
    return [];
  }

  const params = [productId];
  let statusClause = "";
  if (status) {
    params.push(status);
    statusClause = `AND status = $${params.length}`;
  }
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT id, product_id, key_value, status, created_at, updated_at
     FROM product_keys
     WHERE product_id = $1 ${statusClause}
     ORDER BY created_at ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    keyValue: r.key_value,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

async function bulkImportProductKeys(productId, keyValues) {
  const productMeta = await pool.query(
    `SELECT id, app_id
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );
  const productRow = productMeta.rows[0];
  if (!productRow) {
    throw createStoreError("Không tìm thấy sản phẩm", 404);
  }
  if (isCap01AppId(productRow.app_id) || isCap01ProductId(productRow.id)) {
    throw createStoreError("Cấp 01 đã chuyển sang Học Chung Khối. Không import key mới tại web Ứng Dụng Thông Minh.", 410);
  }

  const unique = [...new Set(keyValues.map(k => String(k).trim()).filter(Boolean))];
  if (!unique.length) return { inserted: 0, skipped: 0 };
  let inserted = 0;
  let skipped = 0;
  for (const kv of unique) {
    const r = await pool.query(
      `INSERT INTO product_keys (id, product_id, key_value, status)
       VALUES (gen_random_uuid(), $1, $2, 'available')
       ON CONFLICT (key_value) DO NOTHING`,
      [productId, kv]
    );
    if (r.rowCount > 0) inserted++;
    else skipped++;
  }
  return { inserted, skipped };
}

async function deleteProductKey(keyId) {
  const keyMeta = await pool.query(
    `SELECT pk.id, p.id AS product_id, p.app_id
     FROM product_keys pk
     JOIN products p ON p.id = pk.product_id
     WHERE pk.id = $1::uuid
     LIMIT 1`,
    [keyId]
  );
  const keyRow = keyMeta.rows[0];
  if (!keyRow) {
    return null;
  }
  if (isCap01AppId(keyRow.app_id) || isCap01ProductId(keyRow.product_id)) {
    throw createStoreError("Key Cấp 01 đang ở chế độ read-only.", 410);
  }

  const result = await pool.query(
    `DELETE FROM product_keys
     WHERE id = $1::uuid AND status = 'available'
     RETURNING id, key_value, product_id`,
    [keyId]
  );
  if (result.rowCount === 0) return null;
  return {
    id: result.rows[0].id,
    keyValue: result.rows[0].key_value,
    productId: result.rows[0].product_id
  };
}

const WEB_DEMO_TEMPLATE_SLUGS = new Set(["company", "shop", "salon", "industry", "landing"]);
const WEB_DEMO_LEAD_STATUSES = new Set(["new", "contacted", "qualified", "closed", "spam"]);

function normalizeWebDemoSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  return WEB_DEMO_TEMPLATE_SLUGS.has(slug) ? slug : "";
}

function parseWebDemoTemplateSlug(value) {
  const raw = String(value || "").trim().toLowerCase();
  const match = raw.match(/^(company|shop|salon|industry|landing)(?:__demo([123]))?$/);
  if (!match) {
    return null;
  }
  const baseSlug = match[1];
  const variant = match[2] ? Number(match[2]) : 1;
  return {
    baseSlug,
    variant,
    storageSlug: variant > 1 ? `${baseSlug}__demo${variant}` : baseSlug,
    isVariantScoped: variant > 1
  };
}

function buildWebDemoTemplateSlug(templateSlug, variant = 1) {
  const baseSlug = normalizeWebDemoSlug(templateSlug);
  if (!baseSlug) {
    return "";
  }
  const parsedVariant = Number.parseInt(String(variant || "1"), 10);
  const safeVariant = Number.isFinite(parsedVariant) && parsedVariant >= 1 && parsedVariant <= 3 ? parsedVariant : 1;
  return safeVariant > 1 ? `${baseSlug}__demo${safeVariant}` : baseSlug;
}

function mapWebDemoTemplateRow(row) {
  if (!row) return null;
  const parsedSlug = parseWebDemoTemplateSlug(row.template_slug) || {
    baseSlug: row.template_slug,
    variant: 1,
    storageSlug: row.template_slug,
    isVariantScoped: false
  };
  return {
    slug: row.template_slug,
    baseSlug: parsedSlug.baseSlug,
    variant: parsedSlug.variant,
    isVariantScoped: parsedSlug.isVariantScoped,
    displayName: row.display_name,
    templateGroup: row.template_group,
    config: row.config_json || {},
    seo: row.seo_json || {},
    updatedBy: row.updated_by || "",
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

function mapWebDemoLeadRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    templateSlug: row.template_slug,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email || "",
    companyName: row.company_name || "",
    message: row.message || "",
    metadata: row.metadata || {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listWebDemoTemplates() {
  const result = await pool.query(
    `SELECT template_slug, display_name, template_group, config_json, seo_json, updated_by, updated_at, created_at
     FROM web_demo_templates
     ORDER BY template_group ASC, template_slug ASC`
  );
  return result.rows.map(mapWebDemoTemplateRow);
}

async function getWebDemoTemplate(templateSlug, variant = 1) {
  const baseSlug = normalizeWebDemoSlug(templateSlug);
  const scopedSlug = buildWebDemoTemplateSlug(templateSlug, variant);
  if (!baseSlug || !scopedSlug) {
    throw createStoreError("templateSlug không hợp lệ", 400);
  }

  const requestedVariant = Number.parseInt(String(variant || "1"), 10);
  const safeVariant = Number.isFinite(requestedVariant) && requestedVariant >= 1 && requestedVariant <= 3 ? requestedVariant : 1;
  const querySlugs = safeVariant > 1 ? [scopedSlug, baseSlug] : [baseSlug];

  const result = await pool.query(
    `SELECT template_slug, display_name, template_group, config_json, seo_json, updated_by, updated_at, created_at
     FROM web_demo_templates
     WHERE template_slug = ANY($1::text[])
     ORDER BY CASE WHEN template_slug = $2 THEN 0 ELSE 1 END
     LIMIT 1`,
    [querySlugs, scopedSlug]
  );

  if (result.rowCount === 0) {
    throw createStoreError("Không tìm thấy mẫu web-demo", 404);
  }

  const item = mapWebDemoTemplateRow(result.rows[0]);
  return {
    ...item,
    requestedVariant: safeVariant,
    resolvedVariant: item.variant || 1,
    isFallback: safeVariant > 1 && (item.variant || 1) !== safeVariant
  };
}

async function upsertWebDemoTemplate(templateSlug, input = {}, actor = {}, variant = 1) {
  const baseSlug = normalizeWebDemoSlug(templateSlug);
  const safeSlug = buildWebDemoTemplateSlug(templateSlug, variant);
  if (!baseSlug || !safeSlug) {
    throw createStoreError("templateSlug không hợp lệ", 400);
  }

  const displayName = String(input.displayName || "").trim();
  const templateGroup = String(input.templateGroup || baseSlug).trim().toLowerCase();
  const config = typeof input.config === "object" && input.config !== null ? input.config : {};
  const seo = typeof input.seo === "object" && input.seo !== null ? input.seo : {};
  const updatedBy = String(actor?.username || input.updatedBy || "system").trim() || "system";

  if (!displayName) {
    throw createStoreError("displayName là bắt buộc", 400);
  }

  const result = await pool.query(
    `INSERT INTO web_demo_templates(template_slug, display_name, template_group, config_json, seo_json, created_by, updated_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $6, NOW(), NOW())
     ON CONFLICT (template_slug)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       template_group = EXCLUDED.template_group,
       config_json = EXCLUDED.config_json,
       seo_json = EXCLUDED.seo_json,
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING template_slug, display_name, template_group, config_json, seo_json, updated_by, updated_at, created_at`,
    [safeSlug, displayName, templateGroup, JSON.stringify(config), JSON.stringify(seo), updatedBy]
  );

  return mapWebDemoTemplateRow(result.rows[0]);
}

async function createWebDemoLead(templateSlug, input = {}) {
  const safeSlug = normalizeWebDemoSlug(templateSlug);
  if (!safeSlug) {
    throw createStoreError("templateSlug không hợp lệ", 400);
  }

  const fullName = String(input.fullName || "").trim();
  const phone = String(input.phone || "").trim();
  const email = String(input.email || "").trim();
  const companyName = String(input.companyName || "").trim();
  const message = String(input.message || "").trim();
  const metadata = typeof input.metadata === "object" && input.metadata !== null ? input.metadata : {};

  if (!fullName || !phone) {
    throw createStoreError("fullName và phone là bắt buộc", 400);
  }

  const result = await pool.query(
    `INSERT INTO web_demo_leads(template_slug, full_name, phone, email, company_name, message, metadata, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'new', NOW(), NOW())
     RETURNING id, template_slug, full_name, phone, email, company_name, message, metadata, status, created_at, updated_at`,
    [safeSlug, fullName, phone, email || null, companyName || null, message || null, JSON.stringify(metadata)]
  );

  return mapWebDemoLeadRow(result.rows[0]);
}

async function listWebDemoLeads(filters = {}) {
  const safeSlug = normalizeWebDemoSlug(filters.templateSlug || "");
  const safeStatus = String(filters.status || "").trim().toLowerCase();
  const safeLimit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);

  const params = [];
  const clauses = [];

  if (safeSlug) {
    params.push(safeSlug);
    clauses.push(`template_slug = $${params.length}`);
  }
  if (WEB_DEMO_LEAD_STATUSES.has(safeStatus)) {
    params.push(safeStatus);
    clauses.push(`status = $${params.length}`);
  }

  params.push(safeLimit);

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT id, template_slug, full_name, phone, email, company_name, message, metadata, status, created_at, updated_at
     FROM web_demo_leads
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return result.rows.map(mapWebDemoLeadRow);
}

async function updateWebDemoLeadStatus(leadId, nextStatus) {
  const safeLeadId = String(leadId || "").trim();
  const safeStatus = String(nextStatus || "").trim().toLowerCase();
  if (!safeLeadId) {
    throw createStoreError("leadId là bắt buộc", 400);
  }
  if (!WEB_DEMO_LEAD_STATUSES.has(safeStatus)) {
    throw createStoreError("status không hợp lệ", 400);
  }

  const result = await pool.query(
    `UPDATE web_demo_leads
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, template_slug, full_name, phone, email, company_name, message, metadata, status, created_at, updated_at`,
    [safeLeadId, safeStatus]
  );

  if (result.rowCount === 0) {
    throw createStoreError("Không tìm thấy lead", 404);
  }

  return mapWebDemoLeadRow(result.rows[0]);
}
