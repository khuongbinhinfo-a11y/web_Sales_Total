const path = require("path");
const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { pool } = require("./db/pool");
const { getSepayRuntimeSettings, updateSepayRuntimeSettings } = require("./config/runtimeSettings");

const {
  getPublicCatalog,
  createOrder,
  getOrderDetailsById,
  consumeUsage,
  getCustomerSnapshot,
  getAdminDashboard,
  createCustomerAccount,
  findCustomerByEmail,
  registerCustomerByEmail,
  getCustomerTelegramProfile,
  ensureCustomerTelegramLinkToken,
  refreshCustomerTelegramLinkToken,
  findCustomerByTelegramLinkToken,
  linkCustomerTelegramChat,
  listCustomers,
  findAdminByUsername,
  findAdminById,
  markAdminLoginSuccess,
  createAdminUser,
  listAdminUsers,
  countActiveOwners,
  updateAdminUserById
} = require("./modules/store");
const {
  verifyInternalWebhookSignature,
  processPaidWebhook,
  confirmMockPayment,
  parseStripeWebhook,
  parseSepayWebhook,
  normalizeSepayWebhookSignature,
  buildSepayCheckout,
  sendTelegramMessage,
  isTelegramNotifyEnabled,
  isMockPaymentMode,
  isSepayPaymentMode
} = require("./modules/payment");
const {
  requirePortalAuth,
  requireAdminAuth,
  requireAdminPermission,
  requirePortalOrAdmin,
  handlePortalLogin,
  handleAdminLogin,
  portalLoginPage,
  adminLoginPage,
  clearAuthCookie,
  setAuthCookie,
  createAdminSessionToken,
  getAdminFromSession,
  verifyPassword,
  hashPassword,
  getPermissionsByRole,
  createCustomerSessionToken,
  getCustomerFromSession
} = require("./modules/auth");

const app = express();
const webRoot = path.join(__dirname, "web");

app.disable("x-powered-by");
app.use(cors());
app.use(express.urlencoded({ extended: false }));

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

let cachedTelegramBot = { username: "", fetchedAt: 0 };

async function setupTelegramWebhook() {
  if (!env.telegramBotToken) {
    console.log("⚠️  Telegram bot token not configured, skipping webhook setup");
    return;
  }

  try {
    const botUsername = await getTelegramBotUsername();
    if (!botUsername) {
      console.log("⚠️  Could not fetch Telegram bot username, skipping webhook setup");
      return;
    }

    const webhookUrl = `${env.appBaseUrl}/api/integrations/telegram/webhook`;
    console.log(`📡 Setting up Telegram webhook: ${webhookUrl}`);

    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl })
    });

    const result = await response.json();
    if (result?.ok) {
      console.log("✅ Telegram webhook set successfully");
    } else {
      console.error("❌ Failed to set Telegram webhook:", result?.description || "unknown error");
    }
  } catch (error) {
    console.error("❌ Error setting Telegram webhook:", error.message);
  }
}

async function getTelegramBotUsername() {
  if (!env.telegramBotToken) {
    return "";
  }

  const now = Date.now();
  if (cachedTelegramBot.username && now - cachedTelegramBot.fetchedAt < 10 * 60 * 1000) {
    return cachedTelegramBot.username;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/getMe`);
    const payload = await response.json();
    if (!response.ok || !payload?.ok || !payload?.result?.username) {
      return "";
    }

    cachedTelegramBot = {
      username: String(payload.result.username || "").trim(),
      fetchedAt: now
    };
    return cachedTelegramBot.username;
  } catch {
    return "";
  }
}

function buildTelegramStartLink(botUsername, startToken) {
  if (!botUsername || !startToken) {
    return "";
  }
  return `https://t.me/${botUsername}?start=${encodeURIComponent(startToken)}`;
}

function extractStartTokenFromTelegramText(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return "";
  }

  const startMatch = normalized.match(/^\/start(?:@[A-Za-z0-9_]+)?(?:\s+(.+))?$/i);
  if (!startMatch) {
    return "";
  }

  return String(startMatch[1] || "").trim();
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
  "/api/integrations/telegram/webhook",
  asyncHandler(async (req, res) => {
    const secretHeader = req.header("x-telegram-bot-api-secret-token") || "";
    const expectedSecret = String(env.telegramWebhookSecret || "").trim();
    if (expectedSecret && secretHeader !== expectedSecret) {
      return res.status(401).json({ ok: false, message: "Invalid Telegram webhook secret" });
    }

    const message = req.body?.message || req.body?.edited_message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;

    if (!chatId || !text) {
      return res.json({ ok: true, ignored: true });
    }

    const startToken = extractStartTokenFromTelegramText(text);
    if (!startToken) {
      return res.json({ ok: true, ignored: true });
    }

    const customer = await findCustomerByTelegramLinkToken(startToken);
    if (!customer) {
      await sendTelegramMessage({
        chatId,
        text: "Lien ket het han hoac khong hop le. Vui long vao website tao link moi."
      });
      return res.json({ ok: true, linked: false, reason: "invalid_token" });
    }

    const telegramUsername = String(message?.from?.username || "").trim();
    const linked = await linkCustomerTelegramChat({
      customerId: customer.customerId,
      chatId: String(chatId),
      username: telegramUsername
    });

    await sendTelegramMessage({
      chatId,
      text: `Da lien ket thanh cong voi tai khoan ${customer.email}. Don hang thanh cong se duoc bao tai day.`
    });

    return res.json({ ok: true, linked: Boolean(linked), customerId: customer.customerId });
  })
);

app.get(
  "/api/customer/telegram/link",
  asyncHandler(async (req, res) => {
    const session = getCustomerFromSession(req);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await ensureCustomerTelegramLinkToken(session.customerId);
    if (!profile) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const botUsername = await getTelegramBotUsername();
    const startLink = buildTelegramStartLink(botUsername, profile.telegramLinkToken);

    return res.json({
      linked: Boolean(profile.telegramChatId),
      telegramUsername: profile.telegramUsername,
      telegramLinkedAt: profile.telegramLinkedAt,
      botUsername,
      startToken: profile.telegramLinkToken,
      startLink
    });
  })
);

app.post(
  "/api/customer/telegram/link/refresh",
  asyncHandler(async (req, res) => {
    const session = getCustomerFromSession(req);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await refreshCustomerTelegramLinkToken(session.customerId);
    if (!profile) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const botUsername = await getTelegramBotUsername();
    const startLink = buildTelegramStartLink(botUsername, profile.telegramLinkToken);

    return res.json({
      linked: Boolean(profile.telegramChatId),
      telegramUsername: profile.telegramUsername,
      telegramLinkedAt: profile.telegramLinkedAt,
      botUsername,
      startToken: profile.telegramLinkToken,
      startLink
    });
  })
);

app.post(
  ["/api/payments/webhooks/sepay", "/api/webhooks/sepay"],
  asyncHandler(async (req, res) => {
    const signature = normalizeSepayWebhookSignature(
      req.header("x-sepay-signature") ||
      req.header("x-sepay-token") ||
      req.header("authorization") ||
      req.query.apiKey ||
      req.query.apikey ||
      req.body?.apiKey ||
      req.body?.apikey
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
    try {
      await pool.query("SELECT 1");
      return res.json({
        ok: true,
        environment: env.nodeEnv,
        paymentProviderMode: env.paymentProviderMode,
        database: "connected"
      });
    } catch (error) {
      return res.status(503).json({
        ok: false,
        environment: env.nodeEnv,
        paymentProviderMode: env.paymentProviderMode,
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
  "/api/admin/notifications/telegram/test",
  requireAdminPermission("admins:write"),
  asyncHandler(async (req, res) => {
    if (!env.telegramNotifyEnabled || !env.telegramBotToken || !env.telegramChatId) {
      return res.status(400).json({
        message: "Telegram chưa bật hoặc thiếu TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID",
        configured: false
      });
    }

    const actor = getAdminFromSession(req);
    const text = req.body?.text || `🧪 Test Telegram từ Admin: ${actor?.username || "unknown"} @ ${new Date().toISOString()}`;
    const result = await sendTelegramMessage({ text });
    if (!result.ok) {
      return res.status(502).json({ message: "Gửi Telegram thất bại", result });
    }

    return res.json({ ok: true, result });
  })
);

app.get(
  "/api/admin/integrations/sepay",
  requireAdminPermission("admins:read"),
  asyncHandler(async (req, res) => {
    const current = getSepayRuntimeSettings();
    const effectiveWebhookUrl = current.webhookUrl || `${env.appBaseUrl}/api/webhooks/sepay`;
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
      webhookUrl: next.sepay?.webhookUrl || `${env.appBaseUrl}/api/webhooks/sepay`
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
    setAuthCookie(res, "wst_customer_session", token);
    return res.json({ customer: safeCustomer });
  })
);

app.post(
  "/api/auth/customer/register",
  asyncHandler(async (req, res) => {
    const { email, fullName, password } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 8 ký tự" });
    }

    const passwordHash = hashPassword(password);
    const result = await registerCustomerByEmail(email.trim().toLowerCase(), fullName, passwordHash);
    if (!result.passwordSet) {
      return res.status(409).json({ message: "Email này đã có tài khoản. Vui lòng đăng nhập." });
    }

    const token = createCustomerSessionToken(result.customer.id, result.customer.email);
    setAuthCookie(res, "wst_customer_session", token);
    return res.status(result.created ? 201 : 200).json(result);
  })
);

app.get(
  "/api/auth/me",
  asyncHandler(async (req, res) => {
    const session = getCustomerFromSession(req);
    if (!session) return res.status(401).json({ message: "Not logged in" });
    const refreshedToken = createCustomerSessionToken(session.customerId, session.email || "");
    setAuthCookie(res, "wst_customer_session", refreshedToken);
    const snapshot = await getCustomerSnapshot(session.customerId);
    return res.json(snapshot);
  })
);

app.post("/api/auth/customer/logout", (req, res) => {
  clearAuthCookie(res, "wst_customer_session");
  return res.json({ ok: true });
});

app.get("/admin/login", (req, res) => {
  res.send(adminLoginPage());
});

app.post("/auth/portal/login", handlePortalLogin);
app.post(
  "/auth/admin/login",
  asyncHandler(async (req, res) => {
    const { accessKey, username, password } = req.body;

    if (accessKey) {
      return handleAdminLogin(req, res);
    }

    if (!username || !password) {
      return res.status(401).send("Invalid admin credentials");
    }

    const admin = await findAdminByUsername(String(username).trim().toLowerCase());
    if (!admin || !admin.isActive) {
      return res.status(401).send("Invalid admin credentials");
    }

    const ok = verifyPassword(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).send("Invalid admin credentials");
    }

    await markAdminLoginSuccess(admin.id);

    const token = createAdminSessionToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    });
    setAuthCookie(res, "wst_admin_session", token);
    return res.redirect("/admin");
  })
);

app.post("/auth/portal/logout", (req, res) => {
  clearAuthCookie(res, "wst_portal_session");
  res.redirect("/portal/login");
});

app.post("/auth/admin/logout", (req, res) => {
  clearAuthCookie(res, "wst_admin_session");
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
        <p style="font-size:.82rem;color:#64748b">📲 Nhận báo đơn qua Telegram: bấm nút bên dưới. Chưa liên kết thì xem trong <b>Sản phẩm đã mua</b>.</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 12px">
          <a id="telegramQuickLink" href="/portal" style="display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:10px;background:#0ea5e9;color:#fff;font-size:.84rem;font-weight:700;text-decoration:none">📲 Liên kết Telegram</a>
          <span id="telegramQuickHint" style="font-size:.8rem;color:#64748b">Đang tạo link...</span>
        </div>
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
            <a href="/portal" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:10px;background:#16a34a;color:#fff;font-weight:700">Xem sản phẩm đã mua</a>
            <button id="paidPopupClose" style="min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:600;cursor:pointer">Đóng</button>
          </div>
        </div>
      </div>
      <script>
        const orderId = '${order.id}';
        const isMockMode = ${mockCheckoutEnabled ? "true" : "false"};
        const resultEl = document.getElementById('result');
        const payBtn = document.getElementById('payNow');
        const telegramQuickLink = document.getElementById('telegramQuickLink');
        const telegramQuickHint = document.getElementById('telegramQuickHint');
        const paidPopup = document.getElementById('paidPopup');
        const paidPopupText = document.getElementById('paidPopupText');
        const paidPopupKey = document.getElementById('paidPopupKey');
        let paidPopupShown = false;

        async function setupTelegramQuickLink() {
          try {
            const r = await fetch('/api/customer/telegram/link');
            if (r.status === 401) {
              telegramQuickLink.href = '/portal/login';
              telegramQuickHint.textContent = 'Đăng nhập để liên kết Telegram';
              return;
            }

            if (!r.ok) {
              telegramQuickLink.href = '/portal';
              telegramQuickHint.textContent = 'Mở Portal để liên kết Telegram';
              return;
            }

            const data = await r.json();
            telegramQuickLink.href = data.startLink || '/portal';
            telegramQuickLink.target = data.startLink ? '_blank' : '_self';
            telegramQuickLink.rel = data.startLink ? 'noopener' : '';
            telegramQuickHint.textContent = data.linked
              ? 'Đã liên kết Telegram'
              : 'Bấm nút rồi nhấn Start trong Telegram';
          } catch {
            telegramQuickLink.href = '/portal';
            telegramQuickHint.textContent = 'Mở Portal để liên kết Telegram';
          }
        }

        function showPaidPopup(keyVal) {
          if (paidPopupShown) return;
          paidPopupShown = true;
          paidPopupText.textContent = keyVal
            ? 'Đơn hàng đã xác nhận và key đã sẵn sàng.'
            : 'Đơn hàng đã xác nhận, key đang được cấp. Bạn có thể mở Portal để xem ngay khi key xuất hiện.';
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
        setupTelegramQuickLink();
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
  const message = statusCode >= 500 ? "Internal server error" : error.message;
  if (statusCode >= 500) {
    console.error(error);
  }
  res.status(statusCode).json({ message });
});

const host = "0.0.0.0";
app.listen(env.port, host, async () => {
  console.log(`Ứng Dụng Thông Minh running at ${env.appBaseUrl} (mode=${env.nodeEnv})`);
  await setupTelegramWebhook();
});
