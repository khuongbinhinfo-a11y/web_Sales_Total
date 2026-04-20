const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool } = require("./db/pool");

const {
  getPublicCatalog,
  createOrder,
  markOrderPaid,
  consumeUsage,
  recordWebhookEvent,
  getCustomerSnapshot,
  getAdminDashboard
} = require("./modules/store");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3900;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "web")));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, database: "connected" });
  } catch (error) {
    return res.status(503).json({ ok: false, database: "disconnected", message: error.message });
  }
});

app.get("/api/catalog", async (req, res) => {
  try {
    const catalog = await getPublicCatalog();
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/checkout", async (req, res) => {
  try {
    const { customerId = "cus-demo", appId, productId } = req.body;
    const { order, product } = await createOrder({ customerId, appId, productId });

    res.status(201).json({
      order,
      product,
      checkoutUrl: `/pay/${order.id}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/pay/:orderId", (req, res) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Mock Payment</title>
      <style>
        body { font-family: Segoe UI, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
        button { border: none; background: #22c55e; color: #052e16; font-weight: 700; padding: 12px 18px; border-radius: 10px; cursor: pointer; }
        .card { max-width: 560px; margin: 24px auto; background: #111827; padding: 20px; border-radius: 12px; }
        .small { opacity: 0.8; margin-top: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Mock Checkout Session</h2>
        <p>Order ID: <strong>${req.params.orderId}</strong></p>
        <p>Click de gia lap webhook payment = paid.</p>
        <button id="payNow">Xac nhan da thanh toan</button>
        <p class="small" id="result"></p>
      </div>
      <script>
        document.getElementById('payNow').addEventListener('click', async () => {
          const response = await fetch('/api/webhooks/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-webhook-signature': 'demo-signature' },
            body: JSON.stringify({
              eventId: 'evt_' + Date.now(),
              orderId: '${req.params.orderId}',
              provider: 'mockpay',
              providerTransactionId: 'tx_' + Date.now(),
              status: 'paid'
            })
          });

          const data = await response.json();
          document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        });
      </script>
    </body>
  </html>`;

  res.send(html);
});

app.post("/api/webhooks/payment", async (req, res) => {
  const signature = req.header("x-webhook-signature");
  const secret = process.env.WEBHOOK_SIGNATURE_SECRET || "demo-signature";
  if (!signature) {
    return res.status(401).json({ message: "Missing webhook signature" });
  }
  if (signature !== secret) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  const { eventId, orderId, provider, providerTransactionId, status } = req.body;
  if (!eventId || !orderId || !provider || !providerTransactionId || status !== "paid") {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  try {
    const duplication = await recordWebhookEvent({
      eventId,
      orderId,
      provider,
      providerTransactionId,
      status,
      payload: req.body
    });
    if (duplication.duplicated) {
      return res.json({ ok: true, idempotent: true });
    }

    const result = await markOrderPaid({
      orderId,
      provider,
      providerTransactionId,
      payload: req.body
    });

    return res.json({ ok: true, idempotent: result.idempotent, order: result.order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/usage/consume", async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/portal/:customerId", async (req, res) => {
  try {
    const snapshot = await getCustomerSnapshot(req.params.customerId);
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const dashboard = await getAdminDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "web", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Web Sales Total running at http://localhost:${PORT}`);
});
