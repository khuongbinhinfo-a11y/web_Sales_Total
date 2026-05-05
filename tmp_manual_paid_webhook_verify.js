require("dotenv").config();
const crypto = require("crypto");
const { Client } = require("pg");
const { processPaidWebhook } = require("./src/modules/payment");

function orderCode() {
  return "WST-MOCK-" + Date.now() + "-" + crypto.randomInt(1000, 9999);
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const customerQ = await client.query("SELECT id, email FROM customers ORDER BY created_at DESC LIMIT 1");
  if (!customerQ.rowCount) throw new Error("No customer found to create mock order");
  const customer = customerQ.rows[0];

  const orderId = crypto.randomUUID();
  const metadata = {
    source: "manual-mock-verification",
    templateSlug: "company",
    domainSelection: "mock-domain.com / 1 nam",
    hostingSelection: "1 nam",
    contact: { fullName: "Mock Verify", email: customer.email || "mock@example.com", phone: "" },
    pricing: {
      basePrice: 2990000,
      includeDomain: true,
      domainPrice: 350000,
      domainYears: 1,
      domainName: "mock-domain",
      domainSuffix: ".com",
      includeHosting: true,
      hostingPrice: 1200000,
      hostingYears: 1,
      domainTotal: 350000,
      hostingTotal: 1200000,
      amount: 4540000
    }
  };

  const ins = await client.query(
    `INSERT INTO orders (
      id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
      discount_amount, discount_percent, currency, status, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,'VND','pending',$8::jsonb)
    RETURNING id, order_code, customer_id, status`,
    [
      orderId,
      orderCode(),
      customer.id,
      "app-web-demo-services",
      "prod-web-demo-company-basic",
      4540000,
      4540000,
      JSON.stringify(metadata)
    ]
  );

  const order = ins.rows[0];
  await client.end();
  console.log("ORDER_INSERTED", order);

  const suffix = Date.now();
  const webhookPayload = {
    eventId: `evt_manual_${order.id}_${suffix}`,
    orderId: order.id,
    provider: "mockpay",
    providerTransactionId: `tx_manual_${order.id}_${suffix}`,
    status: "paid",
    source: "manual-test-script"
  };

  const paidResult = await processPaidWebhook(webhookPayload);
  console.log("PAID_WEBHOOK_RESULT", {
    ok: paidResult?.ok,
    idempotent: paidResult?.idempotent,
    orderStatus: paidResult?.order?.status,
    gmailNotification: paidResult?.gmailNotification?.status || null,
    gmailReason: paidResult?.gmailNotification?.reason || null
  });

  const verifyClient = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await verifyClient.connect();
  const events = await verifyClient.query(
    `SELECT event_type, status, recipient, reason, provider, created_at
     FROM email_notification_events
     WHERE order_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [order.id]
  );
  await verifyClient.end();

  console.log("EMAIL_EVENTS_COUNT", events.rowCount);
  console.log("EMAIL_EVENTS", events.rows);
  console.log("PAID_ORDER_EVENT_FOUND", events.rows.some((r) => r.event_type === "paid_order_success"));
})();
