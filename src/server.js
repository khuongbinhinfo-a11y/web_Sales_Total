const path = require("path");
const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { pool } = require("./db/pool");

const {
  getPublicCatalog,
  createOrder,
  getOrderDetailsById,
  consumeUsage,
  getCustomerSnapshot,
  getAdminDashboard,
  findOrCreateCustomerByEmail,
  createCustomerAccount,
  listCustomers,
  findAdminByUsername,
  markAdminLoginSuccess,
  createAdminUser,
  listAdminUsers
} = require("./modules/store");
const {
  verifyInternalWebhookSignature,
  processPaidWebhook,
  confirmMockPayment,
  parseStripeWebhook,
  parseSepayWebhook,
  buildSepayCheckout,
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
  "/api/payments/webhooks/sepay",
  asyncHandler(async (req, res) => {
    const signature =
      req.header("x-sepay-signature") ||
      req.header("x-sepay-token") ||
      req.header("authorization")?.replace(/^Bearer\s+/i, "");

    const normalized = parseSepayWebhook(req.body, signature);
    if (!normalized) {
      return res.json({ ok: true, ignored: true });
    }

    const result = await processPaidWebhook(normalized);
    return res.json(result);
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
          totalRevenue: 0
        },
        latestOrders: [],
        latestTransactions: [],
        activeSubscriptions: []
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

app.get("/portal/login", (req, res) => {
  res.send(portalLoginPage());
});

/* ── Customer email auth ── */
app.post(
  "/api/auth/customer/login",
  asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    const customer = await findOrCreateCustomerByEmail(email.trim().toLowerCase(), fullName);
    const token = createCustomerSessionToken(customer.id, customer.email);
    setAuthCookie(res, "wst_customer_session", token);
    return res.json({ customer });
  })
);

app.get(
  "/api/auth/me",
  asyncHandler(async (req, res) => {
    const session = getCustomerFromSession(req);
    if (!session) return res.status(401).json({ message: "Not logged in" });
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
        <p style="color:#64748b;font-size:.88rem;margin:0 0 16px">Order ID: <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:.82rem">${order.id}</code></p>
        <p style="font-size:.85rem;color:#64748b">${mockCheckoutEnabled ? "Bấm xác nhận để giả lập thanh toán (mock mode)." : "Chuyển khoản theo hướng dẫn bên dưới. Hệ thống tự động cấp key khi nhận được CK qua Sepay."}</p>
        ${sepayPanel}
        <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
          <button id="payNow" style="flex:1;min-height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:800;font-size:.95rem;cursor:pointer;transition:.2s" ${mockCheckoutEnabled ? "" : "disabled"}>✅ Xác nhận đã thanh toán</button>
          <a href="/" style="display:flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:12px;border:1.5px solid #e2e8f0;font-weight:600;font-size:.9rem;color:#0f172a">← Trang chủ</a>
        </div>
        <div id="result" style="margin-top:16px"></div>
      </div>
      <script>
        const orderId = '${order.id}';
        const resultEl = document.getElementById('result');

        async function refreshOrderStatus() {
          const r = await fetch('/api/orders/' + orderId);
          if (!r.ok) return;
          const d = await r.json();
          if (d.order && d.order.status === 'paid') {
            const keyVal = d.keyDelivery && d.keyDelivery.keyValue;
            resultEl.innerHTML = '<div style="background:#f0fdf4;border:1.5px dashed #86efac;border-radius:10px;padding:16px;margin-top:8px">'
              + '<p style="margin:0 0 4px;font-weight:700;color:#166534">✅ Thanh toán thành công!</p>'
              + (keyVal
                  ? '<p style="margin:0;font-family:monospace;font-size:1rem;font-weight:700;color:#166534">🔑 KEY: ' + keyVal + '</p>'
                  : '<p style="margin:0;color:#64748b;font-size:.88rem">🔑 Key đang được cấp, vui lòng đợi thêm...</p>')
              + '</div>';
          }
        }

        document.getElementById('payNow').addEventListener('click', async () => {
          const btn = document.getElementById('payNow');
          btn.disabled = true; btn.textContent = '⏳ Đang xử lý...';
          const r = await fetch('/api/payments/mock/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });
          const d = await r.json();
          refreshOrderStatus();
          if(!d.ok) { btn.disabled = false; btn.textContent = '✅ Xác nhận đã thanh toán'; }
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
  const message = statusCode >= 500 ? "Internal server error" : error.message;
  if (statusCode >= 500) {
    console.error(error);
  }
  res.status(statusCode).json({ message });
});

const host = "0.0.0.0";
app.listen(env.port, host, () => {
  console.log(`Ứng Dụng Thông Minh running at ${env.appBaseUrl} (mode=${env.nodeEnv})`);
});
