const { pool } = require("../db/pool");

function mapOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    appId: row.app_id,
    productId: row.product_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at
  };
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

async function getPublicCatalog() {
  const appsResult = await pool.query(
    "SELECT id, name, slug, status, description FROM apps ORDER BY created_at ASC"
  );
  const productsResult = await pool.query(
    `SELECT id, app_id, name, cycle, price, currency, credits, active
     FROM products
     WHERE active = TRUE
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
    products: productsResult.rows.map((row) => ({
      id: row.id,
      appId: row.app_id,
      name: row.name,
      cycle: row.cycle,
      price: Number(row.price),
      currency: row.currency,
      credits: Number(row.credits),
      active: row.active
    }))
  };
}

async function createOrder({ customerId, appId, productId }) {
  const productResult = await pool.query(
    `SELECT id, app_id, name, cycle, price, currency, credits
     FROM products
     WHERE id = $1 AND app_id = $2 AND active = TRUE`,
    [productId, appId]
  );
  if (productResult.rowCount === 0) {
    throw new Error("Product khong ton tai hoac dang tat");
  }

  const customerResult = await pool.query("SELECT id FROM customers WHERE id = $1", [customerId]);
  if (customerResult.rowCount === 0) {
    throw new Error("Customer khong ton tai");
  }

  const product = productResult.rows[0];
  const orderResult = await pool.query(
    `INSERT INTO orders(id, customer_id, app_id, product_id, amount, currency, status)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending')
     RETURNING id, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at`,
    [customerId, appId, productId, product.price, product.currency]
  );

  return {
    order: mapOrder(orderResult.rows[0]),
    product: {
      id: product.id,
      appId: product.app_id,
      name: product.name,
      cycle: product.cycle,
      price: Number(product.price),
      currency: product.currency,
      credits: Number(product.credits)
    }
  };
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
      `SELECT id, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
       FROM orders
       WHERE id = $1::uuid
       FOR UPDATE`,
      [orderId]
    );
    if (orderResult.rowCount === 0) {
      throw new Error("Order khong ton tai");
    }

    const orderRow = orderResult.rows[0];
    if (orderRow.status === "paid") {
      await client.query("COMMIT");
      return { order: mapOrder(orderRow), idempotent: true };
    }

    const txResult = await client.query(
      `INSERT INTO payment_transactions(id, order_id, provider, provider_transaction_id, amount, status, payload)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, 'paid', $5::jsonb)
       ON CONFLICT (provider_transaction_id) DO NOTHING
       RETURNING id`,
      [orderId, provider, providerTransactionId, orderRow.amount, JSON.stringify(payload)]
    );

    if (txResult.rowCount === 0) {
      await client.query("COMMIT");
      return { order: mapOrder(orderRow), idempotent: true };
    }

    const paidOrderResult = await client.query(
      `UPDATE orders
       SET status = 'paid', paid_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at`,
      [orderId]
    );
    const paidOrder = paidOrderResult.rows[0];

    const productResult = await client.query(
      `SELECT id, app_id, cycle, credits
       FROM products
       WHERE id = $1`,
      [paidOrder.product_id]
    );
    if (productResult.rowCount === 0) {
      throw new Error("Khong tim thay product cho order");
    }
    const product = productResult.rows[0];

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

    await client.query("COMMIT");
    return { order: mapOrder(paidOrder), idempotent: false };
  } catch (error) {
    await client.query("ROLLBACK");
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
  const [customer, orders, subscriptions, entitlements, wallets, ledger, usageLogs] = await Promise.all([
    pool.query("SELECT id, email, full_name FROM customers WHERE id = $1", [customerId]),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
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
    )
  ]);

  return {
    customer:
      customer.rowCount === 0
        ? null
        : {
            id: customer.rows[0].id,
            email: customer.rows[0].email,
            fullName: customer.rows[0].full_name
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
  };
}

async function getAdminDashboard() {
  const [kpiResult, latestOrders, latestTransactions, activeSubscriptions] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM apps) AS total_apps,
         (SELECT COUNT(*)::int FROM customers) AS total_customers,
         (SELECT COUNT(*)::int FROM orders WHERE status = 'paid') AS paid_orders,
         (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending_orders,
         (SELECT COALESCE(SUM(amount), 0)::bigint FROM orders WHERE status = 'paid') AS total_revenue`
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
       FROM orders ORDER BY created_at DESC LIMIT 10`
    ),
    pool.query(
      `SELECT id, order_id, provider, provider_transaction_id, amount, status, verified_at
       FROM payment_transactions ORDER BY verified_at DESC LIMIT 10`
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, status, start_at, end_at, renewal_mode, created_at
       FROM subscriptions WHERE status = 'active' ORDER BY created_at DESC`
    )
  ]);

  const kpi = kpiResult.rows[0];
  return {
    kpi: {
      totalApps: kpi.total_apps,
      totalCustomers: kpi.total_customers,
      paidOrders: kpi.paid_orders,
      pendingOrders: kpi.pending_orders,
      totalRevenue: Number(kpi.total_revenue)
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
    }))
  };
}

module.exports = {
  getPublicCatalog,
  createOrder,
  markOrderPaid,
  consumeUsage,
  recordWebhookEvent,
  getCustomerSnapshot,
  getAdminDashboard
};
