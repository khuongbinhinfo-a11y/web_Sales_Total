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
  getAdminDashboard
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
  requirePortalOrAdmin,
  handlePortalLogin,
  handleAdminLogin,
  portalLoginPage,
  adminLoginPage,
  clearAuthCookie
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
  const { customerId = "cus-demo", appId, productId } = req.body;
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
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const snapshot = await getCustomerSnapshot(req.params.customerId);
    res.json(snapshot);
  })
);

app.get(
  "/api/admin/dashboard",
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const dashboard = await getAdminDashboard();
    res.json(dashboard);
  })
);

app.get("/portal/login", (req, res) => {
  res.send(portalLoginPage());
});

app.get("/admin/login", (req, res) => {
  res.send(adminLoginPage());
});

app.post("/auth/portal/login", handlePortalLogin);
app.post("/auth/admin/login", handleAdminLogin);

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
            <h3>Thong tin chuyen khoan Sepay</h3>
            <p><strong>Ngan hang:</strong> ${sepayCheckout.bankCode || "(chua cau hinh)"}</p>
            <p><strong>So tai khoan:</strong> ${sepayCheckout.accountNumber || "(chua cau hinh)"}</p>
            <p><strong>Chu tai khoan:</strong> ${sepayCheckout.accountName || "(chua cau hinh)"}</p>
            <p><strong>So tien:</strong> ${amountFormatted} ${order.currency}</p>
            <p><strong>Noi dung:</strong> <code>${sepayCheckout.transferContent}</code></p>
            ${sepayCheckout.qrUrl ? `<p><img src="${sepayCheckout.qrUrl}" alt="Sepay QR" style="max-width:260px;border-radius:12px" /></p>` : ""}
            <p class="muted">Neu chua co QR URL, co the dung chuoi tao QR thu cong:</p>
            <p class="small">${sepayCheckout.fallbackQrText}</p>
         </div>`
    : "";

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Checkout Payment</title>
      <style>
        body { font-family: Segoe UI, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
        button { border: none; background: #22c55e; color: #052e16; font-weight: 700; padding: 12px 18px; border-radius: 10px; cursor: pointer; }
        .card { max-width: 560px; margin: 24px auto; background: #111827; padding: 20px; border-radius: 12px; }
        .small { opacity: 0.8; margin-top: 12px; white-space: pre-wrap; }
        .muted { color: #93c5fd; font-size: 13px; }
        .sepay-box { border: 1px solid #334155; border-radius: 12px; padding: 14px; margin: 14px 0; background: #0b1220; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Checkout Session</h2>
        <p>Order ID: <strong>${order.id}</strong></p>
        <p class="muted">Payment mode: ${env.paymentProviderMode}</p>
        <p>${mockCheckoutEnabled ? "Xac nhan thanh toan de gia lap callback provider." : "Thanh toan that se duoc provider callback vao webhook de cap key tu dong."}</p>
        ${sepayPanel}
        <button id="payNow" ${mockCheckoutEnabled ? "" : "disabled"}>Xac nhan da thanh toan</button>
        <p class="small" id="result"></p>
      </div>
      <script>
        const orderId = '${order.id}';
        const resultEl = document.getElementById('result');

        async function refreshOrderStatus() {
          const response = await fetch('/api/orders/' + orderId);
          if (!response.ok) {
            return;
          }

          const data = await response.json();
          if (data.order && data.order.status === 'paid') {
            const keyLine = data.keyDelivery && data.keyDelivery.keyValue
              ? '\\nKEY: ' + data.keyDelivery.keyValue
              : '\\nKEY: Dang cap, vui long doi them';
            resultEl.textContent = 'Thanh toan thanh cong. Don da paid.' + keyLine;
          }
        }

        document.getElementById('payNow').addEventListener('click', async () => {
          const response = await fetch('/api/payments/mock/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });

          const data = await response.json();
          resultEl.textContent = JSON.stringify(data, null, 2);
          refreshOrderStatus();
        });

        setInterval(refreshOrderStatus, 5000);
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
  console.log(`Web Sales Total running at ${env.appBaseUrl} (mode=${env.nodeEnv})`);
});
