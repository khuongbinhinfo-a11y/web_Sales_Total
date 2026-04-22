const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const yaml = require("js-yaml");
const { OAuth2Client } = require("google-auth-library");
const { env, startupConfigIssues } = require("./config/env");
const { runMigrations } = require("./db/migrate");
const { pool } = require("./db/pool");
const { getSepayRuntimeSettings, updateSepayRuntimeSettings, resolveSepayWebhookUrl } = require("./config/runtimeSettings");

const {
  getPublicCatalog,
  createOrder,
  getOrderDetailsById,
  consumeUsage,
  getCustomerSnapshot,
  listCustomerLicenses,
  activateCustomerLicense,
  verifyCustomerLicense,
  deactivateCustomerLicense,
  verifyAppLicenseByKey,
  getAdminDashboard,
  createCustomerAccount,
  findCustomerByEmail,
  registerCustomerByEmail,
  updateCustomerPasswordByEmail,
  ensureCustomerAuthSchema,
  ensureAdminLoginSecuritySchema,
  listCustomers,
  findAdminByUsername,
  findAdminById,
  markAdminLoginSuccess,
  createAdminUser,
  listAdminUsers,
  countActiveOwners,
  updateAdminUserById,
  updateAdminPasswordById,
  getAdminLoginBlockState,
  registerAdminLoginFailureGuard,
  clearAdminLoginFailureGuard,
  recordAdminLoginAudit
} = require("./modules/store");
const {
  verifyInternalWebhookSignature,
  processPaidWebhook,
  confirmMockPayment,
  parseStripeWebhook,
  parseSepayWebhook,
  normalizeSepayWebhookSignature,
  buildSepayCheckout,
  sendGmailMessage,
  isGmailNotifyEnabled,
  isMockPaymentMode,
  isSepayPaymentMode
} = require("./modules/payment");
const {
  requirePortalAuth,
  requireAdminAuth,
  requireAdminPermission,
  requirePortalOrAdmin,
  handlePortalLogin,
  portalLoginPage,
  adminLoginPage,
  clearAuthCookie,
  setAuthCookie,
  createAdminSessionToken,
  createAdminOtpChallengeToken,
  getAdminOtpChallengeFromSession,
  isOtpRequiredForAdminRole,
  getAdminFromSession,
  verifyPassword,
  hashPassword,
  getPermissionsByRole,
  createCustomerSessionToken,
  getCustomerFromSession
} = require("./modules/auth");
const {
  ensureEmailOtpSchema,
  issueAndSendOtp,
  verifyOtpCode,
  isEmailOtpConfigured
} = require("./modules/emailOtp");

const app = express();
const webRoot = path.join(__dirname, "web");
const googleOAuthClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
let prepareServerPromise;

app.disable("x-powered-by");
app.use(cors());
app.use(express.urlencoded({ extended: false }));

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function getRequestIp(req) {
  const forwardedFor = String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  const realIp = String(req?.headers?.["x-real-ip"] || "").trim();
  const socketIp = String(req?.socket?.remoteAddress || "").trim();
  return (forwardedFor || realIp || socketIp || "unknown").toLowerCase();
}

function requireAiAppKey(req, res, next) {
  const configuredKey = String(env.aiAppSharedKey || "").trim();
  if (!configuredKey) {
    return res.status(503).json({ message: "AI app integration key is not configured" });
  }

  const incomingKey = String(req.header("x-ai-app-key") || "").trim();
  if (!incomingKey || incomingKey !== configuredKey) {
    return res.status(401).json({ message: "Invalid AI app key" });
  }

  return next();
}

function maskConfiguredSecret(secret) {
  const value = String(secret || "").trim();
  if (!value) {
    return "";
  }
  if (value.length <= 8) {
    return "********";
  }
  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}

const AI_APP_STANDARD_FEATURES = ["lesson.basic", "practice.core"];
const AI_APP_PREMIUM_FEATURES = ["lesson.basic", "practice.core", "lesson.premium", "ai.voice", "ai.writing"];

function inferPlanTierFromLicense(license) {
  const joined = [license?.planCode, license?.productId]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  if (joined.includes("premium") || joined.includes("pro")) {
    return "premium";
  }
  if (joined.includes("basic")) {
    return "basic";
  }
  return "standard";
}

function computeLicenseGrace(license) {
  const graceDays = Math.max(1, Number(env.aiAppOfflineGraceDays) || 7);
  const lastVerifiedAt = license?.lastVerifiedAt ? new Date(license.lastVerifiedAt) : new Date();
  const offlineUntilDate = new Date(lastVerifiedAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
  const now = Date.now();

  const activeStates = new Set(["active", "inactive"]);
  const status = String(license?.status || "").toLowerCase();
  const statusAllowed = activeStates.has(status);
  const expiryAllowed = !license?.expiresAt || new Date(license.expiresAt).getTime() > now;

  return {
    allowed: statusAllowed && expiryAllowed,
    graceDays,
    offlineUntil: offlineUntilDate.toISOString()
  };
}

function resolveLicenseFeatures(license) {
  const rawFeatures = Array.isArray(license?.metadata?.features)
    ? license.metadata.features
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : null;

  if (rawFeatures && rawFeatures.length > 0) {
    return rawFeatures;
  }

  const tier = inferPlanTierFromLicense(license);
  if (tier === "premium") {
    return AI_APP_PREMIUM_FEATURES;
  }
  return AI_APP_STANDARD_FEATURES;
}

function buildAiAppLicenseView(license) {
  const features = resolveLicenseFeatures(license);
  const grace = computeLicenseGrace(license);
  return {
    ...license,
    features,
    grace
  };
}

const aiGatesDir = path.join(process.cwd(), "docs", "ai-gates");
const aiGateFileByApp = {
  default: "definition-ready-done.yaml",
  desktop: "definition-ready-done.desktop.yaml",
  webapp: "definition-ready-done.webapp.yaml",
  admin: "definition-ready-done.admin.yaml"
};

function normalizeAppName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function resolveAiGateApp(appRaw) {
  const v = normalizeAppName(appRaw);
  if (!v || v === "default" || v === "core" || v === "platform") return "default";
  if (v === "desktop" || v === "electron") return "desktop";
  if (v === "web" || v === "webapp" || v === "frontend") return "webapp";
  if (v === "admin" || v === "backoffice") return "admin";
  return "default";
}

function aiGateFilePath(appRaw) {
  const app = resolveAiGateApp(appRaw);
  const fileName = aiGateFileByApp[app] || aiGateFileByApp.default;
  return { app, fileName, filePath: path.join(aiGatesDir, fileName) };
}

function ensureChecklistItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || "").trim(),
      required: Boolean(item?.required),
      passed: Boolean(item?.passed),
      evidence: String(item?.evidence || "").trim()
    }))
    .filter((item) => item.id);
}

function toGateSummary(data) {
  const ready = ensureChecklistItems(data?.definitionOfReady);
  const done = ensureChecklistItems(data?.definitionOfDone);

  const readyRequired = ready.filter((x) => x.required).length;
  const readyPassed = ready.filter((x) => x.required && x.passed).length;
  const doneRequired = done.filter((x) => x.required).length;
  const donePassed = done.filter((x) => x.required && x.passed).length;

  return {
    readyRequired,
    readyPassed,
    doneRequired,
    donePassed,
    allPassed: readyRequired === readyPassed && doneRequired === donePassed
  };
}

async function readAiGateChecklist(appRaw) {
  const resolved = aiGateFilePath(appRaw);
  if (!fs.existsSync(resolved.filePath)) {
    const err = new Error(`Checklist file not found: ${resolved.fileName}`);
    err.statusCode = 404;
    throw err;
  }

  const raw = await fs.promises.readFile(resolved.filePath, "utf8");
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== "object") {
    const err = new Error("Checklist YAML invalid");
    err.statusCode = 500;
    throw err;
  }

  const data = {
    ...parsed,
    definitionOfReady: ensureChecklistItems(parsed.definitionOfReady),
    definitionOfDone: ensureChecklistItems(parsed.definitionOfDone)
  };

  return {
    app: resolved.app,
    fileName: resolved.fileName,
    filePath: resolved.filePath,
    data,
    summary: toGateSummary(data)
  };
}

function applyChecklistUpdates(existingItems, updates) {
  const current = ensureChecklistItems(existingItems);
  const byId = new Map((Array.isArray(updates) ? updates : []).map((u) => [String(u?.id || "").trim(), u]));

  return current.map((item) => {
    const patch = byId.get(item.id);
    if (!patch) return item;
    return {
      ...item,
      passed: typeof patch.passed === "boolean" ? patch.passed : item.passed,
      evidence: patch.evidence !== undefined ? String(patch.evidence || "").trim() : item.evidence
    };
  });
}

async function writeAiGateChecklist(appRaw, nextData) {
  const resolved = aiGateFilePath(appRaw);
  const dumped = yaml.dump(nextData, { lineWidth: 140, noRefs: true });
  await fs.promises.writeFile(resolved.filePath, dumped, "utf8");
  return resolved;
}

async function getGithubFileSha({ owner, repo, branch, filePath }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "web-sales-total-admin"
    }
  });

  if (res.status === 404) {
    return "";
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(payload?.message || "Cannot read target file from GitHub");
    err.statusCode = res.status;
    throw err;
  }
  return String(payload.sha || "");
}

async function commitChecklistToGithub({ app, message, branch }) {
  if (!env.githubToken) {
    const err = new Error("GITHUB_TOKEN chưa cấu hình");
    err.statusCode = 400;
    throw err;
  }

  const resolved = aiGateFilePath(app);
  const localContent = await fs.promises.readFile(resolved.filePath, "utf8");
  const owner = env.githubRepoOwner;
  const repo = env.githubRepoName;
  const targetBranch = String(branch || env.githubRepoBranch || "main").trim();
  const targetFilePath = `docs/ai-gates/${resolved.fileName}`;

  const sha = await getGithubFileSha({ owner, repo, branch: targetBranch, filePath: targetFilePath });

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetFilePath)}`;
  const payload = {
    message: message || `chore(ai-gate): update ${resolved.fileName}`,
    content: Buffer.from(localContent, "utf8").toString("base64"),
    branch: targetBranch
  };
  if (sha) payload.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "web-sales-total-admin"
    },
    body: JSON.stringify(payload)
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result?.message || "Commit file thất bại");
    err.statusCode = res.status;
    throw err;
  }

  return {
    app: resolved.app,
    fileName: resolved.fileName,
    branch: targetBranch,
    commitSha: result?.commit?.sha || "",
    commitUrl: result?.commit?.html_url || "",
    contentUrl: result?.content?.html_url || ""
  };
}

async function verifyGoogleCredential(idToken) {
  if (!googleOAuthClient || !env.googleClientId) {
    const err = new Error("Google login is not configured");
    err.statusCode = 503;
    throw err;
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: env.googleClientId
  });

  const payload = ticket.getPayload() || {};
  const verified = payload.email_verified === true || payload.email_verified === "true";
  const email = String(payload.email || "").trim().toLowerCase();
  const fullName = String(payload.name || "").trim();

  if (!verified || !email) {
    const err = new Error("Google account email is not verified");
    err.statusCode = 401;
    throw err;
  }

  return {
    email,
    fullName: fullName || email.split("@")[0]
  };
}

app.post(
  "/api/payments/webhooks/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const signature = req.header("stripe-signature");
    const normalized = parseStripeWebhook(req.body, signature);

    if (!normalized) {
      return res.json({ ok: true, ignored: true });
    }

    const result = await processPaidWebhook(normalized);
    return res.json(result);
  })
);

app.use(express.json());

app.post(
  ["/api/payments/webhooks/sepay", "/api/webhooks/sepay", "/api/pay", "/api/pay/"],
  asyncHandler(async (req, res) => {
    const signature = normalizeSepayWebhookSignature(
      req.header("x-sepay-signature") ||
      req.header("x-sepay-token") ||
      req.header("x-sepay-apikey") ||
      req.header("x-sepay-api-key") ||
      req.header("x-api-key") ||
      req.header("x-webhook-secret") ||
      req.header("authorization") ||
      req.query.apiKey ||
      req.query.apikey ||
      req.query.api_key ||
      req.query.token ||
      req.query.secret ||
      req.body?.apiKey ||
      req.body?.apikey ||
      req.body?.api_key ||
      req.body?.token ||
      req.body?.secret
    );

    const normalized = parseSepayWebhook(req.body, signature);
    if (!normalized) {
      return res.status(200).json({ success: true, ok: true, ignored: true });
    }

    const result = await processPaidWebhook(normalized);
    return res.status(200).json({ success: true, ...result });
  })
);

app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    const healthBase = {
      environment: env.nodeEnv,
      paymentProviderMode: env.paymentProviderMode,
      configuration: startupConfigIssues.length > 0 ? "invalid" : "ok",
      configIssues: startupConfigIssues
    };

    try {
      await pool.query("SELECT 1");
      return res.json({
        ok: true,
        ...healthBase,
        database: "connected"
      });
    } catch (error) {
      return res.status(503).json({
        ok: false,
        ...healthBase,
        database: "disconnected",
        message: error.message
      });
    }
  })
);

app.get(
  "/api/catalog",
  asyncHandler(async (req, res) => {
    const catalog = await getPublicCatalog();
    res.json(catalog);
  })
);

async function handleCreateOrder(req, res) {
  const session = getCustomerFromSession(req);
  const customerId = session ? session.customerId : (req.body.customerId || "cus-demo");
  const { appId, productId } = req.body;
  const { order, product } = await createOrder({ customerId, appId, productId });

  res.status(201).json({
    order,
    product,
    checkoutUrl: `/pay/${order.id}`
  });
}

app.post("/api/orders", asyncHandler(handleCreateOrder));
app.post("/api/checkout", asyncHandler(handleCreateOrder));

app.get(
  "/api/orders/:orderId",
  asyncHandler(async (req, res) => {
    const orderDetails = await getOrderDetailsById(req.params.orderId);
    if (!orderDetails) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(orderDetails);
  })
);

app.post(
  "/api/payments/webhooks",
  asyncHandler(async (req, res) => {
    const signature = req.header("x-webhook-signature");
    verifyInternalWebhookSignature(signature);
    const result = await processPaidWebhook(req.body);
    res.json(result);
  })
);

app.post(
  "/api/webhooks/payment",
  asyncHandler(async (req, res) => {
    const signature = req.header("x-webhook-signature");
    verifyInternalWebhookSignature(signature);
    const result = await processPaidWebhook(req.body);
    res.json(result);
  })
);

app.post(
  "/api/payments/mock/confirm",
  asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const result = await confirmMockPayment(orderId);
    return res.json(result);
  })
);

app.post(
  "/api/orders/:orderId/mark-paid",
  asyncHandler(async (req, res) => {
    const result = await confirmMockPayment(req.params.orderId);
    res.json(result);
  })
);

app.post(
  "/api/usage/consume",
  requirePortalOrAdmin,
  asyncHandler(async (req, res) => {
    const {
      customerId = "cus-demo",
      appId,
      featureKey,
      creditsToConsume,
      units = 1,
      requestId,
      metadata
    } = req.body;

    const result = await consumeUsage({
      customerId,
      appId,
      featureKey,
      creditsToConsume,
      units,
      requestId,
      metadata
    });

    if (result.rejected) {
      return res.status(402).json(result);
    }

    return res.json(result);
  })
);

app.get(
  "/api/portal/:customerId",
  requirePortalOrAdmin,
  asyncHandler(async (req, res) => {
    const snapshot = await getCustomerSnapshot(req.params.customerId);
    res.json(snapshot);
  })
);

app.get(
  "/api/customers/:customerId/snapshot",
  requireAdminPermission("customers:read"),
  asyncHandler(async (req, res) => {
    const snapshot = await getCustomerSnapshot(req.params.customerId);
    res.json(snapshot);
  })
);

app.get(
  "/api/customer/licenses",
  requirePortalOrAdmin,
  asyncHandler(async (req, res) => {
    const portalSession = getCustomerFromSession(req);
    const admin = getAdminFromSession(req);

    const requestedCustomerId = String(req.query.customerId || "").trim();
    const customerId = portalSession
      ? portalSession.customerId
      : admin
        ? requestedCustomerId
        : "";

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required for admin requests" });
    }

    const appId = String(req.query.appId || "").trim() || undefined;
    const licenses = await listCustomerLicenses({ customerId, appId });
    return res.json({ customerId, appId: appId || null, licenses });
  })
);

app.post(
  "/api/licenses/:licenseId/activate",
  requirePortalOrAdmin,
  asyncHandler(async (req, res) => {
    const portalSession = getCustomerFromSession(req);
    const admin = getAdminFromSession(req);
    const requestedCustomerId = String(req.body?.customerId || "").trim();

    const customerId = portalSession
      ? portalSession.customerId
      : admin
        ? requestedCustomerId
        : "";

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required for admin requests" });
    }

    const deviceId = String(req.body?.deviceId || "").trim() || null;
    const deviceName = String(req.body?.deviceName || "").trim() || null;
    const license = await activateCustomerLicense({
      licenseId: req.params.licenseId,
      customerId,
      deviceId,
      deviceName
    });

    if (!license) {
      return res.status(404).json({ message: "License not found or not activeable" });
    }

    return res.json({ ok: true, license });
  })
);

app.post(
  "/api/licenses/:licenseId/verify",
  requirePortalOrAdmin,
  asyncHandler(async (req, res) => {
    const portalSession = getCustomerFromSession(req);
    const admin = getAdminFromSession(req);
    const requestedCustomerId = String(req.body?.customerId || "").trim();

    const customerId = portalSession
      ? portalSession.customerId
      : admin
        ? requestedCustomerId
        : "";

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required for admin requests" });
    }

    const deviceId = String(req.body?.deviceId || "").trim() || null;
    const deviceName = String(req.body?.deviceName || "").trim() || null;
    const license = await verifyCustomerLicense({
      licenseId: req.params.licenseId,
      customerId,
      deviceId,
      deviceName
    });

    if (!license) {
      return res.status(404).json({ message: "License not found, revoked or expired" });
    }

    return res.json({ ok: true, license });
  })
);

app.post(
  "/api/licenses/:licenseId/deactivate",
  requirePortalOrAdmin,
  asyncHandler(async (req, res) => {
    const portalSession = getCustomerFromSession(req);
    const admin = getAdminFromSession(req);
    const requestedCustomerId = String(req.body?.customerId || "").trim();

    const customerId = portalSession
      ? portalSession.customerId
      : admin
        ? requestedCustomerId
        : "";

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required for admin requests" });
    }

    const license = await deactivateCustomerLicense({
      licenseId: req.params.licenseId,
      customerId
    });

    if (!license) {
      return res.status(404).json({ message: "License not found or already revoked" });
    }

    return res.json({ ok: true, license });
  })
);

app.get(
  "/api/ai-app/customers/:customerId/licenses",
  requireAiAppKey,
  asyncHandler(async (req, res) => {
    const customerId = String(req.params.customerId || "").trim();
    const appId = String(req.query.appId || "").trim() || undefined;
    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }

    const licenses = await listCustomerLicenses({ customerId, appId });
    const items = licenses.map(buildAiAppLicenseView);
    return res.json({ customerId, appId: appId || null, licenses: items });
  })
);

app.post(
  "/api/ai-app/licenses/verify",
  requireAiAppKey,
  asyncHandler(async (req, res) => {
    const customerId = String(req.body?.customerId || "").trim() || null;
    const appId = String(req.body?.appId || "").trim();
    const licenseKey = String(req.body?.licenseKey || "").trim();
    const deviceId = String(req.body?.deviceId || "").trim() || null;
    const deviceName = String(req.body?.deviceName || "").trim() || null;

    if (!appId || !licenseKey) {
      return res.status(400).json({ message: "appId and licenseKey are required" });
    }

    const license = await verifyAppLicenseByKey({
      appId,
      licenseKey,
      customerId,
      deviceId,
      deviceName
    });

    if (!license) {
      return res.status(404).json({ ok: false, message: "License invalid, expired or revoked" });
    }

    const aiLicense = buildAiAppLicenseView(license);
    return res.json({ ok: true, license: aiLicense, features: aiLicense.features, grace: aiLicense.grace });
  })
);

app.get(
  "/api/admin/dashboard",
  requireAdminPermission("dashboard:read"),
  asyncHandler(async (req, res) => {
    try {
      const dashboard = await getAdminDashboard();
      return res.json(dashboard);
    } catch (error) {
      return res.json({
        degraded: true,
        message: "Dashboard đang chạy ở chế độ tạm thời do DB chưa sẵn sàng",
        kpi: {
          totalApps: 0,
          totalCustomers: 0,
          paidOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          totalCreditBalance: 0,
          totalWallets: 0,
          customersWithWallet: 0
        },
        latestOrders: [],
        latestTransactions: [],
        activeSubscriptions: [],
        topWallets: []
      });
    }
  })
);

app.get(
  "/api/admin/me",
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const admin = getAdminFromSession(req);
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({ admin });
  })
);

app.post(
  "/api/admin/me/password",
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const adminSession = getAdminFromSession(req);
    if (!adminSession?.id) {
      return res.status(400).json({ message: "Phiên đăng nhập hiện tại không hỗ trợ đổi mật khẩu" });
    }

    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (!currentPassword) {
      return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại" });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Mật khẩu mới tối thiểu 8 ký tự" });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
    }

    const admin = await findAdminById(adminSession.id);
    if (!admin || !admin.isActive) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản admin hiện tại" });
    }
    if (!verifyPassword(currentPassword, admin.passwordHash)) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    await updateAdminPasswordById({
      adminId: admin.id,
      passwordHash: hashPassword(newPassword)
    });

    return res.json({ ok: true, message: "Đã cập nhật mật khẩu admin" });
  })
);

app.get(
  "/api/admin/ai-gates",
  requireAdminPermission("admins:read"),
  asyncHandler(async (req, res) => {
    const apps = ["default", "desktop", "webapp", "admin"];
    const output = [];

    for (const appName of apps) {
      try {
        const loaded = await readAiGateChecklist(appName);
        output.push({
          app: loaded.app,
          fileName: loaded.fileName,
          checklistId: loaded.data.checklistId || "",
          updatedAt: loaded.data?.enforcement?.updatedAt || "",
          blockMerge: Boolean(loaded.data?.enforcement?.blockMerge),
          summary: loaded.summary
        });
      } catch {
        output.push({
          app: appName,
          fileName: aiGateFileByApp[appName] || "",
          checklistId: "",
          updatedAt: "",
          blockMerge: false,
          summary: { readyRequired: 0, readyPassed: 0, doneRequired: 0, donePassed: 0, allPassed: false },
          missing: true
        });
      }
    }

    return res.json({ gates: output });
  })
);

app.get(
  "/api/admin/ai-gates/:app",
  requireAdminPermission("admins:read"),
  asyncHandler(async (req, res) => {
    const loaded = await readAiGateChecklist(req.params.app);
    return res.json({
      app: loaded.app,
      fileName: loaded.fileName,
      data: loaded.data,
      summary: loaded.summary
    });
  })
);

app.put(
  "/api/admin/ai-gates/:app",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    const loaded = await readAiGateChecklist(req.params.app);
    const body = req.body || {};

    const next = {
      ...loaded.data,
      enforcement: {
        ...(loaded.data.enforcement || {}),
        updatedAt: new Date().toISOString().slice(0, 10),
        blockMerge: typeof body?.enforcement?.blockMerge === "boolean"
          ? body.enforcement.blockMerge
          : Boolean(loaded.data?.enforcement?.blockMerge)
      },
      definitionOfReady: applyChecklistUpdates(loaded.data.definitionOfReady, body.definitionOfReady),
      definitionOfDone: applyChecklistUpdates(loaded.data.definitionOfDone, body.definitionOfDone)
    };

    await writeAiGateChecklist(req.params.app, next);
    const reloaded = await readAiGateChecklist(req.params.app);
    return res.json({
      ok: true,
      app: reloaded.app,
      fileName: reloaded.fileName,
      data: reloaded.data,
      summary: reloaded.summary
    });
  })
);

app.post(
  "/api/admin/ai-gates/:app/commit",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    const branch = String(req.body?.branch || "").trim();
    const message = String(req.body?.message || "").trim();
    const committed = await commitChecklistToGithub({ app: req.params.app, message, branch });
    return res.json({ ok: true, ...committed });
  })
);

app.get(
  "/api/admin/users",
  requireAdminPermission("customers:read"),
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit || 100);
    const users = await listCustomers(limit);
    return res.json({ users });
  })
);

app.post(
  "/api/admin/users",
  requireAdminPermission("customers:write"),
  asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    const result = await createCustomerAccount(email, fullName);
    return res.status(result.created ? 201 : 200).json(result);
  })
);

app.get(
  "/api/admin/admin-users",
  requireAdminPermission("admins:read"),
  asyncHandler(async (req, res) => {
    const admins = await listAdminUsers();
    return res.json({ admins });
  })
);

app.post(
  "/api/admin/admin-users",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    const actor = getAdminFromSession(req);
    const { username, email, password, role } = req.body;
    const safeUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const safeRole = typeof role === "string" ? role.trim().toLowerCase() : "support";

    if (!safeUsername || !/^[a-z0-9._-]{3,32}$/.test(safeUsername)) {
      return res.status(400).json({ message: "username không hợp lệ (3-32 ký tự a-z0-9._-)" });
    }
    if (!safeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 8 ký tự" });
    }
    if (!["owner", "manager", "support"].includes(safeRole)) {
      return res.status(400).json({ message: "role phải là owner | manager | support" });
    }

    const existed = await findAdminByUsername(safeUsername);
    if (existed) {
      return res.status(409).json({ message: "Username admin đã tồn tại" });
    }

    const passwordHash = hashPassword(password);
    const createdAdmin = await createAdminUser({
      username: safeUsername,
      email: safeEmail,
      passwordHash,
      role: safeRole,
      permissions: getPermissionsByRole(safeRole),
      createdBy: actor?.id || null
    });

    return res.status(201).json({ admin: createdAdmin });
  })
);

app.post(
  "/api/admin/notifications/gmail/test",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    if (!isGmailNotifyEnabled()) {
      return res.status(400).json({
        message: "Gmail chưa bật hoặc thiếu cấu hình OAuth (GMAIL_NOTIFY_ENABLED/GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN/GMAIL_NOTIFY_FROM)",
        configured: false
      });
    }

    const actor = getAdminFromSession(req);
    const now = new Date().toISOString();
    const to = req.body?.to || env.gmailNotifyTo || env.gmailNotifyFrom;
    const subject = req.body?.subject || `[WST] Test Gmail notify @ ${now}`;
    const text = req.body?.text || `Test Gmail từ Admin: ${actor?.username || "unknown"} @ ${now}`;
    const html = req.body?.html || `<p>${text}</p>`;

    const result = await sendGmailMessage({ subject, text, html, to });
    if (!result.ok) {
      return res.status(502).json({ message: "Gửi Gmail thất bại", result });
    }

    return res.json({ ok: true, result });
  })
);

app.get(
  "/api/admin/integrations/sepay",
  requireAdminPermission("admins:read"),
  asyncHandler(async (req, res) => {
    const current = getSepayRuntimeSettings();
    const effectiveWebhookUrl = resolveSepayWebhookUrl(current.webhookUrl, env.appBaseUrl);
    return res.json({
      paymentProviderMode: current.paymentProviderMode || env.paymentProviderMode,
      secretConfigured: Boolean(current.webhookSecret),
      sepay: {
        webhookSecret: current.webhookSecret ? "********" : "",
        bankCode: current.bankCode || env.sepayBankCode,
        bankAccountNumber: current.bankAccountNumber || env.sepayBankAccountNumber,
        accountName: current.accountName || env.sepayAccountName,
        qrTemplateUrl: current.qrTemplateUrl || env.sepayQrTemplateUrl
      },
      webhookUrl: effectiveWebhookUrl
    });
  })
);

app.put(
  "/api/admin/integrations/sepay",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    const {
      paymentProviderMode,
      webhookUrl,
      webhookSecret,
      bankCode,
      bankAccountNumber,
      accountName,
      qrTemplateUrl
    } = req.body || {};

    const safeMode = String(paymentProviderMode || "").trim().toLowerCase();
    if (safeMode && !["mock", "sepay", "stripe"].includes(safeMode)) {
      return res.status(400).json({ message: "paymentProviderMode chỉ nhận mock | sepay | stripe" });
    }

    const safeWebhookUrl = String(webhookUrl || "").trim();
    if (safeWebhookUrl && !/^https?:\/\//i.test(safeWebhookUrl)) {
      return res.status(400).json({ message: "Webhook URL phải bắt đầu bằng http:// hoặc https://" });
    }

    const next = updateSepayRuntimeSettings({
      paymentProviderMode: safeMode || "",
      webhookUrl: safeWebhookUrl,
      webhookSecret: String(webhookSecret || "").trim(),
      bankCode: String(bankCode || "").trim(),
      bankAccountNumber: String(bankAccountNumber || "").trim(),
      accountName: String(accountName || "").trim(),
      qrTemplateUrl: String(qrTemplateUrl || "").trim()
    });

    return res.json({
      ok: true,
      message: "Đã lưu cấu hình Sepay runtime",
      paymentProviderMode: next.paymentProviderMode || env.paymentProviderMode,
      secretConfigured: Boolean(next.sepay?.webhookSecret),
      webhookUrl: resolveSepayWebhookUrl(next.sepay?.webhookUrl, env.appBaseUrl)
    });
  })
);

app.get(
  "/api/admin/integrations/ai-app",
  requireAdminPermission("admins:read"),
  asyncHandler(async (req, res) => {
    const configuredKey = String(env.aiAppSharedKey || "").trim();
    return res.json({
      configured: Boolean(configuredKey),
      maskedKey: maskConfiguredSecret(configuredKey),
      keyLength: configuredKey.length,
      authHeaderName: "x-ai-app-key",
      productionBaseUrl: env.publicAppBaseUrl || env.appBaseUrl,
      endpoints: {
        listLicenses: "/api/ai-app/customers/:customerId/licenses?appId=app-study-12",
        verifyLicense: "/api/ai-app/licenses/verify"
      }
    });
  })
);

app.post(
  "/api/admin/integrations/ai-app/reveal",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    const configuredKey = String(env.aiAppSharedKey || "").trim();
    if (!configuredKey) {
      return res.status(404).json({ message: "AI app shared secret chưa được cấu hình trên server" });
    }

    return res.json({
      ok: true,
      sharedSecret: configuredKey,
      authHeaderName: "x-ai-app-key",
      productionBaseUrl: env.publicAppBaseUrl || env.appBaseUrl
    });
  })
);

app.patch(
  "/api/admin/admin-users/:adminId",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    const actor = getAdminFromSession(req);
    const { role, isActive } = req.body;
    const safeRole = typeof role === "string" ? role.trim().toLowerCase() : "";
    const safeActive = typeof isActive === "boolean" ? isActive : null;

    if (!["owner", "manager", "support"].includes(safeRole)) {
      return res.status(400).json({ message: "role phải là owner | manager | support" });
    }
    if (safeActive === null) {
      return res.status(400).json({ message: "isActive phải là boolean" });
    }

    const target = await findAdminById(req.params.adminId);
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy admin user" });
    }

    if (actor?.id && actor.id === target.id && !safeActive) {
      return res.status(400).json({ message: "Không thể tự vô hiệu hóa tài khoản hiện tại" });
    }

    if (target.role === "owner" && (!safeActive || safeRole !== "owner")) {
      const activeOwnerCount = await countActiveOwners();
      if (activeOwnerCount <= 1) {
        return res.status(400).json({ message: "Hệ thống cần ít nhất 1 owner đang hoạt động" });
      }
    }

    const updated = await updateAdminUserById({
      adminId: req.params.adminId,
      role: safeRole,
      isActive: safeActive,
      permissions: getPermissionsByRole(safeRole)
    });

    return res.json({ admin: updated });
  })
);

app.get("/portal/login", (req, res) => {
  res.send(portalLoginPage());
});

/* ── Customer account auth ── */
app.post(
  "/api/auth/customer/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 8 ký tự" });
    }

    const customer = await findCustomerByEmail(email.trim().toLowerCase());
    if (!customer) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }
    if (!customer.passwordHash) {
      return res.status(400).json({ message: "Tài khoản này chưa có mật khẩu. Hãy bấm Đăng ký để thiết lập mật khẩu." });
    }

    const passwordOk = verifyPassword(password, customer.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const safeCustomer = {
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName
    };

    const token = createCustomerSessionToken(customer.id, customer.email);
    setAuthCookie(res, "wst_customer_session", token, req);
    return res.json({ customer: safeCustomer });
  })
);

app.post(
  "/api/auth/customer/register",
  asyncHandler(async (req, res) => {
    const { email, fullName, password, code } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 8 ký tự" });
    }

    const otpVerify = await verifyOtpCode({
      email: email.trim().toLowerCase(),
      purpose: "signup",
      code: String(code || "")
    });
    if (!otpVerify.ok) {
      return res.status(400).json({ message: otpVerify.message || "Mã xác minh không hợp lệ" });
    }

    const passwordHash = hashPassword(password);
    const result = await registerCustomerByEmail(email.trim().toLowerCase(), fullName, passwordHash);
    if (!result.passwordSet) {
      return res.status(409).json({ message: "Email này đã có tài khoản. Vui lòng đăng nhập." });
    }

    const token = createCustomerSessionToken(result.customer.id, result.customer.email);
    setAuthCookie(res, "wst_customer_session", token, req);
    return res.status(result.created ? 201 : 200).json(result);
  })
);

app.post(
  "/api/auth/customer/register/send-code",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!isEmailOtpConfigured()) {
      return res.status(503).json({ message: "Hệ thống email OTP chưa cấu hình" });
    }

    await issueAndSendOtp({ email, purpose: "signup" });
    return res.json({ ok: true, message: "Đã gửi mã xác minh đến email của bạn" });
  })
);

app.post(
  "/api/auth/customer/password-reset/send-code",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!isEmailOtpConfigured()) {
      return res.status(503).json({ message: "Hệ thống email OTP chưa cấu hình" });
    }

    await issueAndSendOtp({ email, purpose: "reset_password" });
    return res.json({ ok: true, message: "Nếu email tồn tại, mã reset đã được gửi" });
  })
);

app.post(
  "/api/auth/customer/password-reset/confirm",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Mật khẩu mới tối thiểu 8 ký tự" });
    }

    const otpVerify = await verifyOtpCode({ email, purpose: "reset_password", code });
    if (!otpVerify.ok) {
      return res.status(400).json({ message: otpVerify.message || "Mã reset không hợp lệ" });
    }

    const passwordHash = hashPassword(newPassword);
    const updated = await updateCustomerPasswordByEmail(email, passwordHash);
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với email này" });
    }

    return res.json({ ok: true, message: "Đặt lại mật khẩu thành công" });
  })
);

app.get(
  "/api/auth/google/config",
  asyncHandler(async (req, res) => {
    return res.json({
      enabled: Boolean(env.googleClientId),
      clientId: env.googleClientId || ""
    });
  })
);

app.post(
  "/api/auth/customer/google",
  asyncHandler(async (req, res) => {
    const credential = String(req.body?.credential || "").trim();
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    const profile = await verifyGoogleCredential(credential);
    const account = await createCustomerAccount(profile.email, profile.fullName);

    const token = createCustomerSessionToken(account.customer.id, account.customer.email);
    setAuthCookie(res, "wst_customer_session", token, req);
    return res.json({
      customer: account.customer,
      created: account.created,
      provider: "google"
    });
  })
);

app.get(
  "/api/auth/me",
  asyncHandler(async (req, res) => {
    const session = getCustomerFromSession(req);
    if (!session) return res.status(401).json({ message: "Not logged in" });
    const refreshedToken = createCustomerSessionToken(session.customerId, session.email || "");
    setAuthCookie(res, "wst_customer_session", refreshedToken, req);
    const snapshot = await getCustomerSnapshot(session.customerId);
    return res.json(snapshot);
  })
);

app.post("/api/auth/customer/logout", (req, res) => {
  clearAuthCookie(res, "wst_customer_session", req);
  return res.json({ ok: true });
});

app.get("/admin/login", (req, res) => {
  res.send(adminLoginPage());
});

app.post("/auth/portal/login", handlePortalLogin);
app.post(
  "/auth/admin/login",
  asyncHandler(async (req, res) => {
    const { accessKey, username, password, otp } = req.body;
    const safeUsername = String(username || "").trim().toLowerCase();
    const ipAddress = getRequestIp(req);
    const userAgent = String(req.headers["user-agent"] || "");

    const blockState = await getAdminLoginBlockState({
      ipAddress,
      username: safeUsername
    });
    if (blockState.blocked) {
      await recordAdminLoginAudit({
        username: safeUsername,
        ipAddress,
        userAgent,
        loginMethod: "password",
        outcome: "blocked",
        reason: `blocked:${blockState.dimensions.join(",") || "unknown"}`
      });
      res.setHeader("Retry-After", String(blockState.retryAfterSeconds || 60));
      return res.status(429).send("Too many failed admin login attempts. Please try again later.");
    }

    if (accessKey) {
      await registerAdminLoginFailureGuard({
        ipAddress,
        username: safeUsername || "legacy_key",
        windowMs: env.adminLoginWindowMs,
        maxAttempts: env.adminLoginMaxAttempts,
        lockoutMs: env.adminLoginLockoutMs
      });
      await recordAdminLoginAudit({
        username: safeUsername || "legacy_key",
        ipAddress,
        userAgent,
        loginMethod: "owner_key",
        outcome: "failure",
        reason: "owner_key_login_removed",
        role: "owner",
        requiresOtp: false,
        otpVerified: false
      });
      return res.status(400).send("Owner key login has been removed. Please use username/password and OTP.");
    }

    if (!username || !password) {
      await registerAdminLoginFailureGuard({
        ipAddress,
        username: safeUsername,
        windowMs: env.adminLoginWindowMs,
        maxAttempts: env.adminLoginMaxAttempts,
        lockoutMs: env.adminLoginLockoutMs
      });
      await recordAdminLoginAudit({
        username: safeUsername,
        ipAddress,
        userAgent,
        loginMethod: "password",
        outcome: "failure",
        reason: "missing_username_or_password",
        requiresOtp: false,
        otpVerified: false
      });
      return res.status(401).send("Invalid admin credentials");
    }

    const admin = await findAdminByUsername(safeUsername);
    if (!admin || !admin.isActive) {
      await registerAdminLoginFailureGuard({
        ipAddress,
        username: safeUsername,
        windowMs: env.adminLoginWindowMs,
        maxAttempts: env.adminLoginMaxAttempts,
        lockoutMs: env.adminLoginLockoutMs
      });
      await recordAdminLoginAudit({
        username: safeUsername,
        ipAddress,
        userAgent,
        loginMethod: "password",
        outcome: "failure",
        reason: admin ? "inactive_admin" : "admin_not_found",
        adminUserId: admin?.id || null,
        role: admin?.role || null,
        requiresOtp: false,
        otpVerified: false
      });
      return res.status(401).send("Invalid admin credentials");
    }

    const ok = verifyPassword(password, admin.passwordHash);
    if (!ok) {
      await registerAdminLoginFailureGuard({
        ipAddress,
        username: safeUsername,
        windowMs: env.adminLoginWindowMs,
        maxAttempts: env.adminLoginMaxAttempts,
        lockoutMs: env.adminLoginLockoutMs
      });
      await recordAdminLoginAudit({
        username: safeUsername,
        ipAddress,
        userAgent,
        loginMethod: "password",
        outcome: "failure",
        reason: "invalid_password",
        adminUserId: admin.id,
        role: admin.role,
        requiresOtp: isOtpRequiredForAdminRole(admin.role),
        otpVerified: false
      });
      return res.status(401).send("Invalid admin credentials");
    }

    const requiresOtp = isOtpRequiredForAdminRole(admin.role);
    let otpVerified = false;
    if (requiresOtp) {
      if (!isEmailOtpConfigured()) {
        await registerAdminLoginFailureGuard({
          ipAddress,
          username: safeUsername,
          windowMs: env.adminLoginWindowMs,
          maxAttempts: env.adminLoginMaxAttempts,
          lockoutMs: env.adminLoginLockoutMs
        });
        await recordAdminLoginAudit({
          username: safeUsername,
          ipAddress,
          userAgent,
          loginMethod: "password",
          outcome: "failure",
          reason: "otp_email_not_configured",
          adminUserId: admin.id,
          role: admin.role,
          requiresOtp: true,
          otpVerified: false
        });
        return res.status(503).send("OTP email is not configured");
      }

      const otpPurpose = `admin_login:${admin.id}`;
      const challenge = getAdminOtpChallengeFromSession(req);
      const challengeMatched = challenge
        && challenge.adminUserId === admin.id
        && challenge.username === admin.username;

      if (!otp) {
        await issueAndSendOtp({ email: admin.email, purpose: otpPurpose });
        setAuthCookie(
          res,
          "wst_admin_otp_challenge",
          createAdminOtpChallengeToken({ id: admin.id, username: admin.username, role: admin.role }),
          req
        );
        await recordAdminLoginAudit({
          username: safeUsername,
          ipAddress,
          userAgent,
          loginMethod: "password",
          outcome: "challenge",
          reason: "otp_sent",
          adminUserId: admin.id,
          role: admin.role,
          requiresOtp: true,
          otpVerified: false
        });
        return res.status(202).send("OTP sent to admin email. Please submit OTP to continue login.");
      }

      if (!challengeMatched) {
        await issueAndSendOtp({ email: admin.email, purpose: otpPurpose });
        setAuthCookie(
          res,
          "wst_admin_otp_challenge",
          createAdminOtpChallengeToken({ id: admin.id, username: admin.username, role: admin.role }),
          req
        );
        await recordAdminLoginAudit({
          username: safeUsername,
          ipAddress,
          userAgent,
          loginMethod: "password",
          outcome: "challenge",
          reason: "otp_resent_challenge_mismatch",
          adminUserId: admin.id,
          role: admin.role,
          requiresOtp: true,
          otpVerified: false
        });
        return res.status(401).send("OTP session expired. A new OTP has been sent.");
      }

      const verify = await verifyOtpCode({ email: admin.email, purpose: otpPurpose, code: otp });
      if (!verify.ok) {
        await registerAdminLoginFailureGuard({
          ipAddress,
          username: safeUsername,
          windowMs: env.adminLoginWindowMs,
          maxAttempts: env.adminLoginMaxAttempts,
          lockoutMs: env.adminLoginLockoutMs
        });
        await recordAdminLoginAudit({
          username: safeUsername,
          ipAddress,
          userAgent,
          loginMethod: "password",
          outcome: "failure",
          reason: `otp_failed:${verify.message}`,
          adminUserId: admin.id,
          role: admin.role,
          requiresOtp: true,
          otpVerified: false
        });
        return res.status(401).send(verify.message || "Invalid OTP");
      }

      otpVerified = true;
      clearAuthCookie(res, "wst_admin_otp_challenge", req);
    }

    await markAdminLoginSuccess(admin.id);
    await clearAdminLoginFailureGuard({ ipAddress, username: safeUsername });

    const token = createAdminSessionToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    });
    setAuthCookie(res, "wst_admin_session", token, req);

    await recordAdminLoginAudit({
      username: safeUsername,
      ipAddress,
      userAgent,
      loginMethod: "password",
      outcome: "success",
      reason: "password_login_success",
      adminUserId: admin.id,
      role: admin.role,
      requiresOtp,
      otpVerified
    });

    return res.redirect("/admin");
  })
);

app.post("/auth/portal/logout", (req, res) => {
  clearAuthCookie(res, "wst_portal_session", req);
  res.redirect("/portal/login");
});

app.post("/auth/admin/logout", (req, res) => {
  clearAuthCookie(res, "wst_admin_session", req);
  res.redirect("/admin/login");
});

app.get(
  "/pay/:orderId",
  asyncHandler(async (req, res) => {
  const orderDetails = await getOrderDetailsById(req.params.orderId);
  if (!orderDetails) {
    return res.status(404).send("Order not found");
  }

  const { order } = orderDetails;
  const orderRef = order.orderCode || order.id;
  const mockCheckoutEnabled = isMockPaymentMode();
  const sepayCheckoutEnabled = isSepayPaymentMode();
  const sepayCheckout = sepayCheckoutEnabled ? buildSepayCheckout(order) : null;

  const amountFormatted = Number(order.amount).toLocaleString("vi-VN");
  const sepayPanel = sepayCheckoutEnabled
    ? `<div class="sepay-box">
            <h3>💳 Thông tin chuyển khoản Sepay</h3>
            <p><strong>Ngân hàng:</strong> ${sepayCheckout.bankCode || "(chưa cấu hình)"}</p>
            <p><strong>Số tài khoản:</strong> ${sepayCheckout.accountNumber || "(chưa cấu hình)"}</p>
            <p><strong>Chủ tài khoản:</strong> ${sepayCheckout.accountName || "(chưa cấu hình)"}</p>
            <p><strong>Số tiền:</strong> ${amountFormatted} ${order.currency}</p>
            <p><strong>Nội dung CK:</strong> <code>${sepayCheckout.transferContent}</code></p>
            ${sepayCheckout.qrUrl ? `<p><img src="${sepayCheckout.qrUrl}" alt="Sepay QR" style="max-width:260px;border-radius:12px" /></p>` : ""}
            <p style="font-size:.82rem;color:#64748b;margin-top:8px">Nếu chưa có QR URL, dùng chuỗi tạo QR thủ công:</p>
            <p style="font-size:.78rem;word-break:break-all;color:#94a3b8">${sepayCheckout.fallbackQrText}</p>
         </div>`
    : "";

  const html = `<!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Thanh toán đơn hàng | Ứng Dụng Thông Minh</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body style="background:var(--bg,#f8fafc);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px">
      <div style="max-width:560px;width:100%;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.1);padding:32px;border:1px solid #e2e8f0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <span style="font-size:1.6rem">⚡</span>
          <div>
            <strong style="font-size:1.1rem">Ứng Dụng Thông Minh</strong>
            <p style="margin:0;font-size:.78rem;color:#64748b">Checkout</p>
          </div>
        </div>
        <h2 style="margin:0 0 4px;font-size:1.3rem;font-weight:800">Thanh toán đơn hàng</h2>
        <p style="color:#64748b;font-size:.88rem;margin:0 0 8px">Mã đơn: <code style="background:#eef2ff;color:#3730a3;padding:2px 8px;border-radius:6px;font-size:.82rem;font-weight:700">${orderRef}</code></p>
        <p style="color:#94a3b8;font-size:.78rem;margin:0 0 16px">Mã này dùng để đối soát khi thanh toán/chăm sóc khách hàng.</p>
        <p style="font-size:.85rem;color:#64748b">${mockCheckoutEnabled ? "Bấm xác nhận để giả lập thanh toán (mock mode)." : "Chuyển khoản theo hướng dẫn bên dưới. Hệ thống tự động cấp key khi nhận được CK qua Sepay."}</p>
        <p style="font-size:.82rem;color:#64748b">Thông báo trạng thái đơn hàng và key sẽ được gửi qua email hoặc hiển thị trong <b>Sản phẩm đã mua</b>.</p>
        ${sepayPanel}
        <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
          <button id="payNow" style="flex:1;min-height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:800;font-size:.95rem;cursor:pointer;transition:.2s">${mockCheckoutEnabled ? "✅ Xác nhận đã thanh toán" : "🔄 Tôi đã chuyển khoản, kiểm tra ngay"}</button>
          <a href="/" style="display:flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:12px;border:1.5px solid #e2e8f0;font-weight:600;font-size:.9rem;color:#0f172a">← Trang chủ</a>
        </div>
        <div id="result" style="margin-top:16px"></div>
      </div>
      <div id="paidPopup" style="position:fixed;inset:0;background:rgba(2,6,23,.55);display:none;align-items:center;justify-content:center;padding:16px;z-index:9999">
        <div style="max-width:460px;width:100%;background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 20px 60px rgba(0,0,0,.22);padding:22px">
          <h3 style="margin:0 0 8px;font-size:1.15rem;color:#166534">✅ Thanh toán thành công</h3>
          <p id="paidPopupText" style="margin:0 0 14px;color:#0f172a;font-size:.92rem">Hệ thống đã xác nhận đơn hàng của bạn.</p>
          <div id="paidPopupKey" style="display:none;margin:0 0 14px;padding:10px 12px;background:#f0fdf4;border:1px dashed #86efac;border-radius:10px;font-family:monospace;color:#166534;font-weight:700"></div>
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
            <a href="/?myproducts=1" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:10px;background:#16a34a;color:#fff;font-weight:700">Xem sản phẩm đã mua</a>
            <button id="paidPopupClose" style="min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:600;cursor:pointer">Đóng</button>
          </div>
        </div>
      </div>
      <script>
        const orderId = '${order.id}';
        const isMockMode = ${mockCheckoutEnabled ? "true" : "false"};
        const resultEl = document.getElementById('result');
        const payBtn = document.getElementById('payNow');
        const paidPopup = document.getElementById('paidPopup');
        const paidPopupText = document.getElementById('paidPopupText');
        const paidPopupKey = document.getElementById('paidPopupKey');
        let paidPopupShown = false;

        function showPaidPopup(keyVal) {
          if (paidPopupShown) return;
          paidPopupShown = true;
          paidPopupText.textContent = keyVal
            ? 'Đơn hàng đã xác nhận và key đã sẵn sàng.'
            : 'Đơn hàng đã xác nhận, key đang được cấp. Hệ thống sẽ tiếp tục xử lý và cập nhật cho đơn hàng này.';
          if (keyVal) {
            paidPopupKey.style.display = 'block';
            paidPopupKey.textContent = 'KEY: ' + keyVal;
          } else {
            paidPopupKey.style.display = 'none';
            paidPopupKey.textContent = '';
          }
          paidPopup.style.display = 'flex';
        }

        document.getElementById('paidPopupClose').addEventListener('click', () => {
          paidPopup.style.display = 'none';
        });

        paidPopup.addEventListener('click', (e) => {
          if (e.target === paidPopup) {
            paidPopup.style.display = 'none';
          }
        });

        async function refreshOrderStatus() {
          try {
            const r = await fetch('/api/orders/' + orderId);
            if (!r.ok) return false;
            const d = await r.json();
            if (d.order && d.order.status === 'paid') {
              const keyVal = d.keyDelivery && d.keyDelivery.keyValue;
              resultEl.innerHTML = '<div style="background:#f0fdf4;border:1.5px dashed #86efac;border-radius:10px;padding:16px;margin-top:8px">'
                + '<p style="margin:0 0 4px;font-weight:700;color:#166534">✅ Thanh toán thành công!</p>'
                + (keyVal
                    ? '<p style="margin:0;font-family:monospace;font-size:1rem;font-weight:700;color:#166534">🔑 KEY: ' + keyVal + '</p>'
                    : '<p style="margin:0;color:#64748b;font-size:.88rem">🔑 Key đang được cấp, vui lòng đợi thêm...</p>')
                + '</div>';
              payBtn.disabled = true;
              payBtn.textContent = '✅ Đã xác nhận thanh toán';
              payBtn.style.opacity = '.85';
              showPaidPopup(keyVal);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        payBtn.addEventListener('click', async () => {
          if (!isMockMode) {
            payBtn.disabled = true;
            payBtn.textContent = '⏳ Đang kiểm tra trạng thái...';
            const paid = await refreshOrderStatus();
            if (!paid) {
              resultEl.innerHTML = '<div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:14px;color:#1e3a8a;font-size:.88rem">'
                + 'Hệ thống chưa nhận webhook thanh toán. Vui lòng chờ 5-15 giây rồi bấm kiểm tra lại.'
                + '</div>';
              payBtn.disabled = false;
              payBtn.textContent = '🔄 Tôi đã chuyển khoản, kiểm tra ngay';
            }
            return;
          }

          payBtn.disabled = true;
          payBtn.textContent = '⏳ Đang xử lý...';
          const r = await fetch('/api/payments/mock/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });
          const d = await r.json();
          await refreshOrderStatus();
          if(!d.ok) {
            payBtn.disabled = false;
            payBtn.textContent = '✅ Xác nhận đã thanh toán';
          }
        });

        setInterval(refreshOrderStatus, 4000);
        refreshOrderStatus();
      </script>
    </body>
  </html>`;

  res.send(html);
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(webRoot, "index.html"));
});

app.get("/pricing", (req, res) => {
  res.sendFile(path.join(webRoot, "index.html"));
});

app.get("/portal", requirePortalAuth, (req, res) => {
  res.sendFile(path.join(webRoot, "portal.html"));
});

app.get("/admin", requireAdminAuth, (req, res) => {
  res.sendFile(path.join(webRoot, "admin.html"));
});

app.use((req, res, next) => {
  if (req.path === "/portal.html") {
    return res.redirect("/portal");
  }

  if (req.path === "/admin.html") {
    return res.redirect("/admin");
  }

  return next();
});

app.use(express.static(webRoot));
app.use(
  "/products/image",
  express.static(path.join(__dirname, "..", "products", "image"))
);

app.get("/product/:id", (req, res) => {
  res.sendFile(path.join(webRoot, "product.html"));
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  if (req.accepts("html")) {
    return res.sendFile(path.join(webRoot, "index.html"));
  }

  return next();
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const errorCode = String(error?.code || "").toUpperCase();
  const errorMessage = String(error?.message || "");
  const isAuthApi = req.path.startsWith("/api/auth/customer/");
  const dbUnavailableCodes = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "57P01", "3D000", "08001", "08006"]);
  const dbUnavailable =
    dbUnavailableCodes.has(errorCode) ||
    /ECONNREFUSED|connect|Connection terminated|database .* does not exist/i.test(errorMessage);

  let message = statusCode >= 500 ? "Internal server error" : error.message;
  let finalStatusCode = statusCode;

  if (statusCode >= 500 && isAuthApi && dbUnavailable) {
    finalStatusCode = 503;
    message = "Hệ thống tạm thời chưa kết nối được cơ sở dữ liệu. Vui lòng thử lại sau 1-2 phút.";
  }

  if (statusCode >= 500 && isAuthApi && errorCode === "42703") {
    finalStatusCode = 503;
    message = "Cơ sở dữ liệu chưa cập nhật schema đăng nhập. Vui lòng chạy migrate và thử lại.";
  }

  if (errorCode === "MISSING_DATABASE_URL") {
    finalStatusCode = 503;
    message = "Hệ thống chưa cấu hình kết nối cơ sở dữ liệu.";
  }

  if (statusCode >= 500) {
    console.error(error);
  }
  res.status(finalStatusCode).json({ message });
});

async function prepareServer() {
  if (!prepareServerPromise) {
    prepareServerPromise = (async () => {
      if (!env.databaseUrl) {
        console.warn("⚠️ Skipping schema bootstrap because DATABASE_URL is not configured.");
        return;
      }

      await runMigrations({ closePool: false });

      try {
        await ensureCustomerAuthSchema();
        await ensureEmailOtpSchema();
        await ensureAdminLoginSecuritySchema();
        console.log("✅ Customer auth schema ready");
      } catch (error) {
        console.error("⚠️ Could not auto-ensure customer auth schema:", error.message);
      }
    })();
  }

  return prepareServerPromise;
}

async function startServer() {
  await prepareServer();
  const host = "0.0.0.0";
  app.listen(env.port, host, () => {
    console.log(`Ứng Dụng Thông Minh running at ${env.appBaseUrl} (mode=${env.nodeEnv})`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  prepareServer,
  startServer
};
