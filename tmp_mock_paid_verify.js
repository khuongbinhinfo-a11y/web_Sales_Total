const { Client } = require("pg");

(async () => {
  const base = "http://localhost:3900";
  const email = "mock." + Date.now() + "@example.com";

  const createRes = await fetch(base + "/api/web-demo/orders/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      templateSlug: "company",
      basePrice: 2990000,
      includeDomain: true,
      domainPrice: 350000,
      domainYears: 1,
      domainSuffix: ".com",
      domainName: "demomock" + Date.now(),
      includeHosting: true,
      hostingPrice: 1200000,
      hostingYears: 1,
      email,
      fullName: "Mock Paid Email Event"
    })
  });

  const createPayload = await createRes.json();
  if (!createRes.ok) {
    console.log("CREATE_FAILED", createPayload);
    process.exit(1);
  }

  const orderId = createPayload?.order?.id;
  const orderCode = createPayload?.order?.order_code;
  console.log("ORDER_CREATED", { orderId, orderCode, email });

  const confirmRes = await fetch(base + "/api/payments/mock/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId })
  });

  const confirmPayload = await confirmRes.json();
  console.log("MOCK_CONFIRM_STATUS", confirmRes.status);
  console.log("MOCK_CONFIRM", {
    ok: confirmPayload?.ok,
    idempotent: confirmPayload?.idempotent,
    gmailNotification: confirmPayload?.gmailNotification
  });

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const q = await client.query(
    "SELECT event_type, status, recipient, reason, provider, created_at, payload->>'orderCode' AS payload_order_code FROM email_notification_events WHERE order_id = $1 ORDER BY created_at DESC LIMIT 5",
    [orderId]
  );

  await client.end();

  console.log("EMAIL_EVENTS_COUNT", q.rowCount);
  console.log("EMAIL_EVENTS", q.rows);

  const paidEvent = q.rows.find((r) => r.event_type === "paid_order_success");
  console.log("PAID_ORDER_EVENT_FOUND", Boolean(paidEvent));
  if (!paidEvent) {
    process.exit(2);
  }
})();
