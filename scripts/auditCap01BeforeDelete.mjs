import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { pool } = require("../src/db/pool");

const CAP01_APP_IDS = ["app-study-12", "hoctap-cap-01"];
const CAP01_PRODUCT_IDS = [
  "cap01_standard_1year_3grades",
  "cap01_grade_la_1year",
  "cap01_grade_1_1year",
  "cap01_grade_2_1year",
  "cap01_grade_3_1year",
  "cap01_grade_4_1year",
  "cap01_grade_5_1year",
  "prod-study-month",
  "prod-study-year",
  "prod-study-premium-month",
  "prod-study-premium-year",
  "prod-study-standard-lifetime",
  "prod-study-premium-lifetime",
  "prod-study-topup",
  "standard_1year_1grade",
  "cap01_beta_year_299"
];

const TEST_PATTERNS = [
  /(^|[^a-z0-9])(demo|test|mock|dev|sample|internal|beta)([^a-z0-9]|$)/i,
  /cus-demo/i,
  /wst-.*test/i
];

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function isTestLikeText(value) {
  const text = normalizeLower(value);
  if (!text) {
    return false;
  }
  return TEST_PATTERNS.some((pattern) => pattern.test(text));
}

function isTestLikeCustomer(row) {
  return (
    isTestLikeText(row?.customer_id) ||
    isTestLikeText(row?.email) ||
    isTestLikeText(row?.full_name) ||
    isTestLikeText(row?.customer_name) ||
    isTestLikeText(row?.app_id) ||
    isTestLikeText(row?.metadata_source) ||
    isTestLikeText(row?.metadata_note)
  );
}

async function tableExists(tableName) {
  const result = await pool.query("SELECT to_regclass($1) IS NOT NULL AS exists", [`public.${tableName}`]);
  return Boolean(result.rows[0]?.exists);
}

async function queryRows(tableName, sql, params = []) {
  if (!(await tableExists(tableName))) {
    return [];
  }
  const result = await pool.query(sql, params);
  return result.rows;
}

async function countRows(tableName, sql, params = []) {
  const rows = await queryRows(tableName, sql, params);
  return Number(rows[0]?.cnt || 0);
}

function uniqueCustomers(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = normalize(row.customer_id);
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    appIds: CAP01_APP_IDS,
    productIds: CAP01_PRODUCT_IDS,
    tables: {},
    relatedCustomers: [],
    realDataFindings: [],
    safeToDelete: false
  };

  const tableChecks = [
    {
      key: "apps",
      table: "apps",
      sql: `SELECT COUNT(*)::int AS cnt FROM apps WHERE id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "app_registry",
      table: "app_registry",
      sql: `SELECT COUNT(*)::int AS cnt FROM app_registry WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "products",
      table: "products",
      sql: `SELECT COUNT(*)::int AS cnt FROM products WHERE app_id = ANY($1::text[]) OR id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "orders",
      table: "orders",
      sql: `SELECT COUNT(*)::int AS cnt FROM orders WHERE app_id = ANY($1::text[]) OR product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "order_items",
      table: "order_items",
      sql: `SELECT COUNT(*)::int AS cnt FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "payment_transactions",
      table: "payment_transactions",
      sql: `SELECT COUNT(*)::int AS cnt
            FROM payment_transactions pt
            JOIN orders o ON o.id = pt.order_id
            WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "payment_webhook_events",
      table: "payment_webhook_events",
      sql: `SELECT COUNT(*)::int AS cnt
            FROM payment_webhook_events pwe
            JOIN orders o ON o.id = pwe.order_id
            WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "subscriptions",
      table: "subscriptions",
      sql: `SELECT COUNT(*)::int AS cnt FROM subscriptions WHERE app_id = ANY($1::text[]) OR product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "entitlements",
      table: "entitlements",
      sql: `SELECT COUNT(*)::int AS cnt FROM entitlements WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "credit_wallets",
      table: "credit_wallets",
      sql: `SELECT COUNT(*)::int AS cnt FROM credit_wallets WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "credit_ledger",
      table: "credit_ledger",
      sql: `SELECT COUNT(*)::int AS cnt FROM credit_ledger WHERE app_id = ANY($1::text[]) OR order_id IN (SELECT id FROM orders WHERE app_id = ANY($1::text[]) OR product_id = ANY($2::text[]))`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "product_keys",
      table: "product_keys",
      sql: `SELECT COUNT(*)::int AS cnt FROM product_keys WHERE product_id = ANY($1::text[])`,
      params: [CAP01_PRODUCT_IDS]
    },
    {
      key: "order_key_deliveries",
      table: "order_key_deliveries",
      sql: `SELECT COUNT(*)::int AS cnt
            FROM order_key_deliveries d
            JOIN orders o ON o.id = d.order_id
            WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[]) OR d.product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "app_licenses",
      table: "app_licenses",
      sql: `SELECT COUNT(*)::int AS cnt FROM app_licenses WHERE app_id = ANY($1::text[]) OR product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    },
    {
      key: "app_license_runtime_leases",
      table: "app_license_runtime_leases",
      sql: `SELECT COUNT(*)::int AS cnt FROM app_license_runtime_leases WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "app_registry_checks",
      table: "app_registry_checks",
      sql: `SELECT COUNT(*)::int AS cnt FROM app_registry_checks WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "app_registry_audit_logs",
      table: "app_registry_audit_logs",
      sql: `SELECT COUNT(*)::int AS cnt FROM app_registry_audit_logs WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "ai_usage_logs",
      table: "ai_usage_logs",
      sql: `SELECT COUNT(*)::int AS cnt FROM ai_usage_logs WHERE app_id = ANY($1::text[])`,
      params: [CAP01_APP_IDS]
    },
    {
      key: "email_notification_events",
      table: "email_notification_events",
      sql: `SELECT COUNT(*)::int AS cnt
            FROM email_notification_events ene
            JOIN orders o ON o.id = ene.order_id
            WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])`,
      params: [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
    }
  ];

  for (const item of tableChecks) {
    const exists = await tableExists(item.table);
    let cnt = 0;
    if (exists) {
      const result = await pool.query(item.sql, item.params);
      cnt = Number(result.rows[0]?.cnt || 0);
    }
    report.tables[item.key] = { exists, count: cnt };
  }

  const paidOrders = await queryRows(
    "orders",
    `SELECT o.id, o.order_code, o.status, o.app_id, o.product_id, o.customer_id, o.metadata,
            c.email, c.full_name
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])
     ORDER BY o.created_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const transactions = await queryRows(
    "payment_transactions",
    `SELECT pt.id, pt.provider, pt.provider_transaction_id, pt.amount, pt.status, pt.payload,
            o.id AS order_id, o.order_code, o.status AS order_status, o.app_id, o.product_id,
            o.customer_id, c.email, c.full_name
     FROM payment_transactions pt
     JOIN orders o ON o.id = pt.order_id
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])
     ORDER BY pt.verified_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const webhookEvents = await queryRows(
    "payment_webhook_events",
    `SELECT pwe.event_id, pwe.provider, pwe.provider_transaction_id, pwe.status, pwe.payload,
            o.id AS order_id, o.order_code, o.status AS order_status, o.app_id, o.product_id,
            o.customer_id, c.email, c.full_name
     FROM payment_webhook_events pwe
     JOIN orders o ON o.id = pwe.order_id
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[])
     ORDER BY pwe.received_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const licenses = await queryRows(
    "app_licenses",
    `SELECT al.id, al.license_key, al.status, al.app_id, al.product_id, al.order_id,
            al.customer_id, al.metadata, c.email, c.full_name
     FROM app_licenses al
     LEFT JOIN customers c ON c.id = al.customer_id
     WHERE al.app_id = ANY($1::text[]) OR al.product_id = ANY($2::text[])
     ORDER BY al.created_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const runtimeLeases = await queryRows(
    "app_license_runtime_leases",
    `SELECT rtl.license_id, rtl.customer_id, rtl.app_id, rtl.client_type, rtl.client_id,
            rtl.client_name, c.email, c.full_name
     FROM app_license_runtime_leases rtl
     LEFT JOIN customers c ON c.id = rtl.customer_id
     WHERE rtl.app_id = ANY($1::text[])
     ORDER BY rtl.last_seen_at DESC`,
    [CAP01_APP_IDS]
  );

  const keyDeliveries = await queryRows(
    "order_key_deliveries",
    `SELECT d.id, d.order_id, d.product_id, d.key_id, d.delivered_to_customer,
            d.delivery_channel, d.delivered_payload, c.email, c.full_name, o.app_id
     FROM order_key_deliveries d
     JOIN orders o ON o.id = d.order_id
     LEFT JOIN customers c ON c.id = d.delivered_to_customer
     WHERE o.app_id = ANY($1::text[]) OR o.product_id = ANY($2::text[]) OR d.product_id = ANY($2::text[])
     ORDER BY d.delivered_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const subscriptions = await queryRows(
    "subscriptions",
    `SELECT s.id, s.status, s.app_id, s.product_id, s.customer_id, c.email, c.full_name
     FROM subscriptions s
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.app_id = ANY($1::text[]) OR s.product_id = ANY($2::text[])
     ORDER BY s.created_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const entitlements = await queryRows(
    "entitlements",
    `SELECT e.id, e.app_id, e.customer_id, c.email, c.full_name
     FROM entitlements e
     LEFT JOIN customers c ON c.id = e.customer_id
     WHERE e.app_id = ANY($1::text[])
     ORDER BY e.updated_at DESC`,
    [CAP01_APP_IDS]
  );

  const wallets = await queryRows(
    "credit_wallets",
    `SELECT w.customer_id, w.app_id, w.balance, c.email, c.full_name
     FROM credit_wallets w
     LEFT JOIN customers c ON c.id = w.customer_id
     WHERE w.app_id = ANY($1::text[])
     ORDER BY w.updated_at DESC`,
    [CAP01_APP_IDS]
  );

  const ledger = await queryRows(
    "credit_ledger",
    `SELECT l.id, l.app_id, l.customer_id, l.order_id, l.change_amount, l.reason, c.email, c.full_name
     FROM credit_ledger l
     LEFT JOIN customers c ON c.id = l.customer_id
     WHERE l.app_id = ANY($1::text[]) OR l.order_id IN (
       SELECT id FROM orders WHERE app_id = ANY($1::text[]) OR product_id = ANY($2::text[])
     )
     ORDER BY l.created_at DESC`,
    [CAP01_APP_IDS, CAP01_PRODUCT_IDS]
  );

  const usageLogs = await queryRows(
    "ai_usage_logs",
    `SELECT u.id, u.customer_id, u.app_id, u.feature_key, u.request_id, u.metadata, c.email, c.full_name
     FROM ai_usage_logs u
     LEFT JOIN customers c ON c.id = u.customer_id
     WHERE u.app_id = ANY($1::text[])
     ORDER BY u.created_at DESC`,
    [CAP01_APP_IDS]
  );

  const relatedCustomerRows = uniqueCustomers([
    ...paidOrders,
    ...transactions,
    ...webhookEvents,
    ...licenses,
    ...runtimeLeases,
    ...keyDeliveries,
    ...subscriptions,
    ...entitlements,
    ...wallets,
    ...ledger,
    ...usageLogs
  ]);

  report.relatedCustomers = relatedCustomerRows.map((row) => ({
    customerId: row.customer_id,
    email: row.email || null,
    fullName: row.full_name || null,
    testLike: isTestLikeCustomer(row)
  }));

  const realFindings = [];

  for (const row of paidOrders) {
    const status = normalizeLower(row.status);
    const isPaid = status === "paid";
    if (isPaid && !isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "paid_order",
        orderId: row.id,
        orderCode: row.order_code,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        productId: row.product_id
      });
    }
  }

  const suspiciousTransactionStatuses = new Set(["paid", "success", "verified", "completed"]);
  for (const row of transactions) {
    const status = normalizeLower(row.status);
    if (suspiciousTransactionStatuses.has(status) && !isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "payment_transaction",
        transactionId: row.id,
        providerTransactionId: row.provider_transaction_id,
        status: row.status,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        productId: row.product_id
      });
    }
  }

  for (const row of webhookEvents) {
    if (!isTestLikeCustomer(row) && suspiciousTransactionStatuses.has(normalizeLower(row.status))) {
      realFindings.push({
        kind: "payment_webhook_event",
        eventId: row.event_id,
        providerTransactionId: row.provider_transaction_id,
        status: row.status,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        productId: row.product_id
      });
    }
  }

  for (const row of licenses) {
    if (normalizeLower(row.status) !== "revoked" && !isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "app_license",
        licenseId: row.id,
        licenseKey: row.license_key,
        status: row.status,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        productId: row.product_id
      });
    }
  }

  for (const row of keyDeliveries) {
    if (!isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "order_key_delivery",
        deliveryId: row.id,
        customerId: row.delivered_to_customer,
        email: row.email || null,
        appId: row.app_id,
        productId: row.product_id
      });
    }
  }

  for (const row of subscriptions) {
    if (!isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "subscription",
        subscriptionId: row.id,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        productId: row.product_id
      });
    }
  }

  for (const row of entitlements) {
    if (!isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "entitlement",
        entitlementId: row.id,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id
      });
    }
  }

  for (const row of wallets) {
    if (!isTestLikeCustomer(row) && Number(row.balance || 0) !== 0) {
      realFindings.push({
        kind: "credit_wallet",
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        balance: Number(row.balance || 0)
      });
    }
  }

  for (const row of ledger) {
    if (!isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "credit_ledger",
        ledgerId: row.id,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        orderId: row.order_id || null
      });
    }
  }

  for (const row of usageLogs) {
    if (!isTestLikeCustomer(row)) {
      realFindings.push({
        kind: "ai_usage_log",
        usageId: row.id,
        customerId: row.customer_id,
        email: row.email || null,
        appId: row.app_id,
        featureKey: row.feature_key
      });
    }
  }

  report.realDataFindings = realFindings;
  report.safeToDelete = realFindings.length === 0;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const reportPath = path.join(__dirname, "..", "reports", "cap01-audit-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("CAP01 audit report written to:", reportPath);
  console.log("SAFE_TO_DELETE=" + String(report.safeToDelete).toUpperCase());
  for (const [key, value] of Object.entries(report.tables)) {
    console.log(`${key}: exists=${value.exists} count=${value.count}`);
  }
  if (report.relatedCustomers.length > 0) {
    console.log("RELATED_CUSTOMERS=");
    for (const customer of report.relatedCustomers.slice(0, 20)) {
      console.log(`- ${customer.customerId} | ${customer.email || "(no email)"} | testLike=${customer.testLike}`);
    }
  }
  if (report.realDataFindings.length > 0) {
    console.log("REAL_DATA_FINDINGS=");
    for (const finding of report.realDataFindings.slice(0, 20)) {
      console.log(`- ${finding.kind}: ${JSON.stringify(finding)}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("[auditCap01BeforeDelete] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
