const crypto = require("crypto");
const { pool } = require("../db/pool");

function generateReadableOrderCode() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `WST-${timePart}-${randomPart}`;
}

function mapOrder(row) {
  return {
    id: row.id,
    orderCode: row.order_code,
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

function mapKeyDelivery(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    orderId: row.order_id,
    orderCode: row.order_code || null,
    productId: row.product_id,
    keyId: row.key_id,
    keyValue: row.key_value,
    deliveredToCustomer: row.delivered_to_customer,
    deliveryChannel: row.delivery_channel,
    deliveredPayload: row.delivered_payload,
    deliveredAt: row.delivered_at
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
  let orderRow = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderCode = generateReadableOrderCode();
    try {
      const orderResult = await pool.query(
        `INSERT INTO orders(id, order_code, customer_id, app_id, product_id, amount, currency, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'pending')
         RETURNING id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at`,
        [orderCode, customerId, appId, productId, product.price, product.currency]
      );
      orderRow = orderResult.rows[0];
      break;
    } catch (error) {
      const uniqueOrderCodeConflict =
        error?.code === "23505" &&
        (String(error?.constraint || "").includes("order_code") ||
          String(error?.detail || "").includes("order_code"));
      if (!uniqueOrderCodeConflict || attempt === 4) {
        throw error;
      }
    }
  }

  return {
    order: mapOrder(orderRow),
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

async function getOrderById(orderId) {
  const result = await pool.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
     FROM orders
     WHERE id = $1::uuid`,
    [orderId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapOrder(result.rows[0]);
}

async function getOrderByCode(orderCode) {
  const normalizedCode = String(orderCode || "").trim().toUpperCase();
  if (!normalizedCode) {
    return null;
  }

  const compactCode = normalizedCode.replace(/[^A-Z0-9]/g, "");

  const result = await pool.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
     FROM orders
     WHERE order_code = $1 OR REPLACE(order_code, '-', '') = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedCode, compactCode]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapOrder(result.rows[0]);
}

async function getOrderKeyDelivery(orderId) {
  const deliveryResult = await pool.query(
    `SELECT d.id, d.order_id, o.order_code, d.product_id, d.key_id, d.delivered_to_customer, d.delivery_channel,
            d.delivered_payload, d.delivered_at, k.key_value
     FROM order_key_deliveries d
     JOIN product_keys k ON k.id = d.key_id
     JOIN orders o ON o.id = d.order_id
     WHERE d.order_id = $1::uuid`,
    [orderId]
  );

  if (deliveryResult.rowCount === 0) {
    return null;
  }

  return mapKeyDelivery(deliveryResult.rows[0]);
}

async function getOrderDetailsById(orderId) {
  const order = await getOrderById(orderId);
  if (!order) {
    return null;
  }

  const keyDelivery = await getOrderKeyDelivery(orderId);
  return { order, keyDelivery };
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
      `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
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
      const existingDelivery = await getOrderKeyDelivery(orderId);
      await client.query("COMMIT");
      return { order: mapOrder(orderRow), keyDelivery: existingDelivery, idempotent: true };
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
       RETURNING id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at`,
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

    const deliveryResult = await client.query(
      `SELECT d.id, d.order_id, o.order_code, d.product_id, d.key_id, d.delivered_to_customer, d.delivery_channel,
              d.delivered_payload, d.delivered_at, k.key_value
       FROM order_key_deliveries d
       JOIN product_keys k ON k.id = d.key_id
       JOIN orders o ON o.id = d.order_id
       WHERE d.order_id = $1::uuid`,
      [paidOrder.id]
    );

    let keyDelivery = deliveryResult.rowCount === 0 ? null : mapKeyDelivery(deliveryResult.rows[0]);

    if (!keyDelivery) {
      const keyResult = await client.query(
        `SELECT id, key_value
         FROM product_keys
         WHERE product_id = $1 AND status = 'available'
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1`,
        [paidOrder.product_id]
      );

      if (keyResult.rowCount > 0) {
        const selectedKey = keyResult.rows[0];

        await client.query(
          `UPDATE product_keys
           SET status = 'delivered', delivered_order_id = $1::uuid, updated_at = NOW()
           WHERE id = $2::uuid`,
          [paidOrder.id, selectedKey.id]
        );

        const insertedDelivery = await client.query(
          `INSERT INTO order_key_deliveries(
             id, order_id, product_id, key_id, delivered_to_customer, delivery_channel, delivered_payload
           )
           VALUES (gen_random_uuid(), $1::uuid, $2, $3::uuid, $4, 'portal_auto', $5::jsonb)
           ON CONFLICT (order_id) DO NOTHING
           RETURNING id, order_id, product_id, key_id, delivered_to_customer, delivery_channel, delivered_payload, delivered_at`,
          [
            paidOrder.id,
            paidOrder.product_id,
            selectedKey.id,
            paidOrder.customer_id,
            JSON.stringify({ keyValue: selectedKey.key_value, source: "auto_after_paid" })
          ]
        );

        if (insertedDelivery.rowCount > 0) {
          keyDelivery = {
            ...mapKeyDelivery(insertedDelivery.rows[0]),
            keyValue: selectedKey.key_value
          };
        } else {
          keyDelivery = await getOrderKeyDelivery(paidOrder.id);
        }
      }
    }

    await client.query("COMMIT");
    return { order: mapOrder(paidOrder), keyDelivery, idempotent: false };
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
  const [customer, orders, subscriptions, entitlements, wallets, ledger, usageLogs, keyDeliveries] = await Promise.all([
    pool.query("SELECT id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at FROM customers WHERE id = $1", [customerId]),
    pool.query(
      `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
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
    ),
    pool.query(
      `SELECT d.id, d.order_id, o.order_code, d.product_id, d.key_id, d.delivered_to_customer, d.delivery_channel,
              d.delivered_payload, d.delivered_at, k.key_value
       FROM order_key_deliveries d
       JOIN product_keys k ON k.id = d.key_id
       JOIN orders o ON o.id = d.order_id
       WHERE d.delivered_to_customer = $1
       ORDER BY d.delivered_at DESC`,
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
            fullName: customer.rows[0].full_name,
            telegramChatId: customer.rows[0].telegram_chat_id || "",
            telegramUsername: customer.rows[0].telegram_username || "",
            telegramLinkedAt: customer.rows[0].telegram_linked_at || null
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
    ,
    keyDeliveries: keyDeliveries.rows.map(mapKeyDelivery)
  };
}

function generateTelegramLinkToken(customerId) {
  const randomPart = crypto.randomBytes(10).toString("hex");
  return `tg_${customerId}_${randomPart}`;
}

async function getCustomerTelegramProfile(customerId) {
  const result = await pool.query(
    `SELECT id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token
     FROM customers
     WHERE id = $1`,
    [customerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function ensureCustomerTelegramLinkToken(customerId) {
  const current = await getCustomerTelegramProfile(customerId);
  if (!current) {
    return null;
  }

  if (current.telegramLinkToken) {
    return current;
  }

  const nextToken = generateTelegramLinkToken(customerId);
  const updated = await pool.query(
    `UPDATE customers
     SET telegram_link_token = $2
     WHERE id = $1
     RETURNING id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token`,
    [customerId, nextToken]
  );

  const row = updated.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function refreshCustomerTelegramLinkToken(customerId) {
  const nextToken = generateTelegramLinkToken(customerId);
  const updated = await pool.query(
    `UPDATE customers
     SET telegram_link_token = $2
     WHERE id = $1
     RETURNING id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token`,
    [customerId, nextToken]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  const row = updated.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function findCustomerByTelegramLinkToken(token) {
  const normalized = String(token || "").trim();
  if (!normalized) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at, telegram_link_token
     FROM customers
     WHERE telegram_link_token = $1`,
    [normalized]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null,
    telegramLinkToken: row.telegram_link_token || ""
  };
}

async function linkCustomerTelegramChat({ customerId, chatId, username }) {
  const safeChatId = String(chatId || "").trim();
  if (!safeChatId) {
    throw new Error("chatId is required");
  }

  const safeUsername = String(username || "").trim();
  const updated = await pool.query(
    `UPDATE customers
     SET telegram_chat_id = $2,
         telegram_username = $3,
         telegram_linked_at = NOW(),
         telegram_link_token = NULL
     WHERE id = $1
     RETURNING id, email, full_name, telegram_chat_id, telegram_username, telegram_linked_at`,
    [customerId, safeChatId, safeUsername]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  const row = updated.rows[0];
  return {
    customerId: row.id,
    email: row.email,
    fullName: row.full_name,
    telegramChatId: row.telegram_chat_id || "",
    telegramUsername: row.telegram_username || "",
    telegramLinkedAt: row.telegram_linked_at || null
  };
}

async function getCustomerTelegramByCustomerId(customerId) {
  const result = await pool.query(
    `SELECT telegram_chat_id, telegram_username, telegram_linked_at
     FROM customers
     WHERE id = $1`,
    [customerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    chatId: result.rows[0].telegram_chat_id || "",
    username: result.rows[0].telegram_username || "",
    linkedAt: result.rows[0].telegram_linked_at || null
  };
}

async function getAdminDashboard() {
  const [kpiResult, latestOrders, latestTransactions, activeSubscriptions, walletStatsResult, topWalletsResult] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM apps) AS total_apps,
         (SELECT COUNT(*)::int FROM customers) AS total_customers,
         (SELECT COUNT(*)::int FROM orders WHERE status = 'paid') AS paid_orders,
         (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending_orders,
         (SELECT COALESCE(SUM(amount), 0)::bigint FROM orders WHERE status = 'paid') AS total_revenue`
    ),
    pool.query(
      `SELECT id, order_code, customer_id, app_id, product_id, amount, currency, status, created_at, paid_at
       FROM orders ORDER BY created_at DESC LIMIT 10`
    ),
    pool.query(
      `SELECT id, order_id, provider, provider_transaction_id, amount, status, verified_at
       FROM payment_transactions ORDER BY verified_at DESC LIMIT 10`
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, status, start_at, end_at, renewal_mode, created_at
       FROM subscriptions WHERE status = 'active' ORDER BY created_at DESC`
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(balance), 0)::bigint AS total_credit_balance,
         COUNT(*)::int AS total_wallets,
         COUNT(DISTINCT customer_id)::int AS customers_with_wallet
       FROM credit_wallets`
    ),
    pool.query(
      `SELECT w.customer_id, c.full_name, c.email, w.app_id, w.balance, w.updated_at
       FROM credit_wallets w
       JOIN customers c ON c.id = w.customer_id
       ORDER BY w.balance DESC, w.updated_at DESC
       LIMIT 10`
    )
  ]);

  const kpi = kpiResult.rows[0];
  const walletStats = walletStatsResult.rows[0] || {
    total_credit_balance: 0,
    total_wallets: 0,
    customers_with_wallet: 0
  };
  return {
    kpi: {
      totalApps: kpi.total_apps,
      totalCustomers: kpi.total_customers,
      paidOrders: kpi.paid_orders,
      pendingOrders: kpi.pending_orders,
      totalRevenue: Number(kpi.total_revenue),
      totalCreditBalance: Number(walletStats.total_credit_balance),
      totalWallets: Number(walletStats.total_wallets),
      customersWithWallet: Number(walletStats.customers_with_wallet)
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
    })),
    topWallets: topWalletsResult.rows.map((row) => ({
      customerId: row.customer_id,
      fullName: row.full_name,
      email: row.email,
      appId: row.app_id,
      balance: Number(row.balance),
      updatedAt: row.updated_at
    }))
  };
}

async function findOrCreateCustomerByEmail(email, fullName) {
  const existing = await pool.query("SELECT id, email, full_name FROM customers WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    return { id: existing.rows[0].id, email: existing.rows[0].email, fullName: existing.rows[0].full_name };
  }
  const id = `cus-${Date.now()}`;
  const name = fullName || email.split("@")[0];
  await pool.query("INSERT INTO customers(id, email, full_name) VALUES ($1, $2, $3)", [id, email, name]);
  return { id, email, fullName: name };
}

async function createCustomerAccount(email, fullName) {
  const normalizedEmail = email.trim().toLowerCase();
  const existed = await pool.query("SELECT id, email, full_name FROM customers WHERE email = $1", [normalizedEmail]);
  if (existed.rowCount > 0) {
    return {
      customer: {
        id: existed.rows[0].id,
        email: existed.rows[0].email,
        fullName: existed.rows[0].full_name
      },
      created: false
    };
  }

  const id = `cus-${Date.now()}`;
  const name = fullName || normalizedEmail.split("@")[0];
  const createdResult = await pool.query(
    "INSERT INTO customers(id, email, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name",
    [id, normalizedEmail, name]
  );

  return {
    customer: {
      id: createdResult.rows[0].id,
      email: createdResult.rows[0].email,
      fullName: createdResult.rows[0].full_name
    },
    created: true
  };
}

async function findCustomerByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query(
    "SELECT id, email, full_name, password_hash FROM customers WHERE email = $1",
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash || ""
  };
}

async function registerCustomerByEmail(email, fullName, passwordHash) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await pool.query(
    "SELECT id, email, full_name, password_hash FROM customers WHERE email = $1",
    [normalizedEmail]
  );

  if (existing.rowCount > 0) {
    const row = existing.rows[0];
    if (row.password_hash) {
      return {
        customer: {
          id: row.id,
          email: row.email,
          fullName: row.full_name
        },
        created: false,
        passwordSet: false
      };
    }

    const nextName = (fullName || row.full_name || normalizedEmail.split("@")[0]).trim();
    const updated = await pool.query(
      `UPDATE customers
       SET full_name = $2,
           password_hash = $3
       WHERE id = $1
       RETURNING id, email, full_name`,
      [row.id, nextName, passwordHash]
    );

    return {
      customer: {
        id: updated.rows[0].id,
        email: updated.rows[0].email,
        fullName: updated.rows[0].full_name
      },
      created: false,
      passwordSet: true
    };
  }

  const id = `cus-${Date.now()}`;
  const name = (fullName || normalizedEmail.split("@")[0]).trim();
  const created = await pool.query(
    `INSERT INTO customers(id, email, full_name, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name`,
    [id, normalizedEmail, name, passwordHash]
  );

  return {
    customer: {
      id: created.rows[0].id,
      email: created.rows[0].email,
      fullName: created.rows[0].full_name
    },
    created: true,
    passwordSet: true
  };
}

async function updateCustomerPasswordByEmail(email, passwordHash) {
  const normalizedEmail = email.trim().toLowerCase();
  const updated = await pool.query(
    `UPDATE customers
     SET password_hash = $2
     WHERE email = $1
     RETURNING id, email, full_name`,
    [normalizedEmail, passwordHash]
  );

  if (updated.rowCount === 0) {
    return null;
  }

  return {
    id: updated.rows[0].id,
    email: updated.rows[0].email,
    fullName: updated.rows[0].full_name
  };
}

async function ensureCustomerAuthSchema() {
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT");
}

async function listCustomers(limit = 100) {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 500 ? limit : 100;
  const result = await pool.query(
    `SELECT id, email, full_name, created_at
     FROM customers
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at
  }));
}

async function findAdminByUsername(username) {
  const result = await pool.query(
    `SELECT id, username, email, role, permissions, password_hash, is_active, created_by, created_at, last_login_at
     FROM admin_users
     WHERE username = $1`,
    [username]
  );
  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function findAdminById(adminId) {
  const result = await pool.query(
    `SELECT id, username, email, role, permissions, password_hash, is_active, created_by, created_at, last_login_at
     FROM admin_users
     WHERE id = $1::uuid`,
    [adminId]
  );
  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function markAdminLoginSuccess(adminId) {
  await pool.query("UPDATE admin_users SET last_login_at = NOW() WHERE id = $1::uuid", [adminId]);
}

async function createAdminUser({ username, email, passwordHash, role, permissions, createdBy }) {
  const result = await pool.query(
    `INSERT INTO admin_users(id, username, email, password_hash, role, permissions, created_by)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6::uuid)
     RETURNING id, username, email, role, permissions, is_active, created_by, created_at, last_login_at`,
    [username, email, passwordHash, role, JSON.stringify(permissions || []), createdBy || null]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

async function listAdminUsers() {
  const result = await pool.query(
    `SELECT id, username, email, role, permissions, is_active, created_by, created_at, last_login_at
     FROM admin_users
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  }));
}

async function countActiveOwners() {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM admin_users
     WHERE role = 'owner' AND is_active = TRUE`
  );
  return Number(result.rows[0]?.total || 0);
}

async function updateAdminUserById({ adminId, role, permissions, isActive }) {
  const result = await pool.query(
    `UPDATE admin_users
     SET role = $2,
         permissions = $3::jsonb,
         is_active = $4,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, username, email, role, permissions, is_active, created_by, created_at, last_login_at`,
    [adminId, role, JSON.stringify(permissions || []), isActive]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    permissions: row.permissions,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at
  };
}

module.exports = {
  getPublicCatalog,
  createOrder,
  getOrderById,
  getOrderByCode,
  getOrderDetailsById,
  markOrderPaid,
  consumeUsage,
  recordWebhookEvent,
  getOrderKeyDelivery,
  getCustomerSnapshot,
  getAdminDashboard,
  findOrCreateCustomerByEmail,
  createCustomerAccount,
  findCustomerByEmail,
  registerCustomerByEmail,
  updateCustomerPasswordByEmail,
  ensureCustomerAuthSchema,
  getCustomerTelegramProfile,
  ensureCustomerTelegramLinkToken,
  refreshCustomerTelegramLinkToken,
  findCustomerByTelegramLinkToken,
  linkCustomerTelegramChat,
  getCustomerTelegramByCustomerId,
  listCustomers,
  findAdminByUsername,
  findAdminById,
  markAdminLoginSuccess,
  createAdminUser,
  listAdminUsers,
  countActiveOwners,
  updateAdminUserById
};
