require("dotenv").config();
const crypto = require("crypto");
const { Client } = require("pg");
const { processPaidWebhook } = require("./src/modules/payment");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const customerQ = await client.query("SELECT id, email FROM customers ORDER BY created_at DESC LIMIT 1");
  const customer = customerQ.rows[0];
  const orderId = crypto.randomUUID();

  const metadata = {
    source: "manual-mock-verification",
    templateSlug: "company",
    demoVariant: 2,
    productName: "Company - Nhieu trang dich vu",
    planSlug: "chuyen-nghiep",
    domainSelection: "mock-company.com / 1 nam",
    hostingSelection: "1 nam",
    contact: { fullName: "Mock Verify", email: customer.email || "mock@example.com", phone: "" },
    pricing: {
      basePrice: 3590000,
      includeDomain: true,
      domainPrice: 350000,
      domainYears: 1,
      domainName: "mock-company",
      domainSuffix: ".com",
      includeHosting: true,
      hostingPrice: 1200000,
      hostingYears: 1,
      domainTotal: 350000,
      hostingTotal: 1200000,
      amount: 5140000
    }
  };

  const ins = await client.query(
    `INSERT INTO orders (
      id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
      discount_amount, discount_percent, currency, status, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,'VND','pending',$8::jsonb)
    RETURNING id, order_code`,
    [
      orderId,
      `WST-MOCK-${Date.now()}-${crypto.randomInt(1000, 9999)}`,
      customer.id,
      "app-web-demo-services",
      "prod-web-demo-company-basic",
      5140000,
      5140000,
      JSON.stringify(metadata)
    ]
  );

  await client.end();
  const order = ins.rows[0];

  const payload = {
    eventId: `evt_manual_${order.id}_${Date.now()}`,
    orderId: order.id,
    provider: "mockpay",
    providerTransactionId: `tx_manual_${order.id}_${Date.now()}`,
    status: "paid",
    source: "manual-test-script"
  };

  const paidResult = await processPaidWebhook(payload);
  console.log("PAID_RESULT", {
    ok: paidResult?.ok,
    status: paidResult?.order?.status,
    eventType: paidResult?.gmailNotification?.eventType,
    emailStatus: paidResult?.gmailNotification?.status
  });

  const verifyClient = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await verifyClient.connect();
  const q = await verifyClient.query(
    `SELECT event_type, status, payload->>'subject' AS subject, payload->>'text' AS text
     FROM email_notification_events
     WHERE order_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [order.id]
  );
  await verifyClient.end();

  console.log("LATEST_EMAIL_EVENT", q.rows[0]);
})();
