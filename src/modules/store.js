const crypto = require("crypto");
const { pool } = require("../db/pool");

const LICENSE_RUNTIME_LEASE_SECONDS = 180;

function generateReadableOrderCode() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `WST-${timePart}-${randomPart}`;
}

function mapOrder(row) {
  const amount = Number(row.amount);
  const subtotalAmount = Number(row.subtotal_amount ?? row.amount);
  const discountAmount = Number(row.discount_amount ?? 0);
  const discountPercent = Number(row.discount_percent ?? 0);
  return {
    id: row.id,
    orderCode: row.order_code,
    customerId: row.customer_id,
    appId: row.app_id,
    productId: row.product_id,
    amount,
    subtotalAmount,
    discountAmount,
    discountPercent,
    discountCode: row.discount_code || null,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at
  };
}

function mapDiscountCode(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    code: row.code,
    percentOff: Number(row.percent_off),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: Boolean(row.active),
    singleUse: row.single_use !== false,
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByAdminId: row.created_by_admin_id || null,
    createdByUsername: row.created_by_username || null,
    usedAt: row.used_at || null,
    usedOrderId: row.used_order_id || null,
    usedOrderCode: row.used_order_code || null,
    usageStatus: row.usage_status || "available",
    reservedOrderId: row.reserved_order_id || null,
    reservedOrderCode: row.reserved_order_code || null
  };
}

function normalizeDiscountCode(value) {
  return String(value || "").trim().toUpperCase();
}

function createStoreError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function computeDiscountAmount(amount, percentOff) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safePercent = Math.max(0, Math.min(100, Number(percentOff) || 0));
  return Math.round((safeAmount * safePercent) / 100);
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

function mapAppLicense(row) {
  if (!row) {
    return null;
  }

  const activeLease = row.lease_client_id
    ? {
        licenseId: row.lease_license_id || row.id,
        customerId: row.lease_customer_id || row.customer_id,
        appId: row.lease_app_id || row.app_id,
        clientType: row.lease_client_type,
        clientId: row.lease_client_id,
        clientName: row.lease_client_name || null,
        acquiredAt: row.lease_acquired_at || null,
        lastSeenAt: row.lease_last_seen_at || null,
        expiresAt: row.lease_expires_at || null,
        metadata: row.lease_metadata || {}
      }
    : null;

  return {
    id: row.id,
    customerId: row.customer_id,
    appId: row.app_id,
    productId: row.product_id,
    orderId: row.order_id,
    planCode: row.plan_code,
    billingCycle: row.billing_cycle,
    licenseKey: row.license_key,
    status: row.status,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    deviceId: row.device_id,
    deviceName: row.device_name,
    lastVerifiedAt: row.last_verified_at,
    metadata: row.metadata,
    activeLease,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRuntimeLease(row) {
  if (!row) {
    return null;
  }

  return {
    licenseId: row.license_id,
    customerId: row.customer_id,
    appId: row.app_id,
    clientType: row.client_type,
    clientId: row.client_id,
    clientName: row.client_name || null,
    acquiredAt: row.acquired_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    metadata: row.metadata || {}
  };
}

function normalizeRuntimeClientProfile(value) {
  return String(value || "").trim().toLowerCase() === "desktop" ? "desktop" : "web";
}

function normalizeRuntimeClientId(deviceId) {
  const normalized = String(deviceId || "").trim();
  return normalized || null;
}

async function findActiveLicenseRuntimeLease(licenseId) {
  const result = await pool.query(
    `SELECT license_id, customer_id, app_id, client_type, client_id, client_name,
            acquired_at, last_seen_at, expires_at, metadata
     FROM app_license_runtime_leases
     WHERE license_id = $1::uuid AND expires_at > NOW()
     LIMIT 1`,
    [licenseId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRuntimeLease(result.rows[0]);
}

async function claimOrRenewLicenseRuntimeLease({ license, clientId, clientType, clientName }) {
  const result = await pool.query(
    `INSERT INTO app_license_runtime_leases(
       license_id, customer_id, app_id, client_type, client_id, client_name,
       acquired_at, last_seen_at, expires_at, metadata
     )
     VALUES (
       $1::uuid, $2, $3, $4, $5, $6,
       NOW(), NOW(), NOW() + ($7::text || ' seconds')::interval, '{}'::jsonb
     )
     ON CONFLICT (license_id) DO UPDATE
     SET client_type = EXCLUDED.client_type,
         client_id = EXCLUDED.client_id,
         client_name = COALESCE(EXCLUDED.client_name, app_license_runtime_leases.client_name),
         last_seen_at = NOW(),
         expires_at = NOW() + ($7::text || ' seconds')::interval,
         metadata = COALESCE(app_license_runtime_leases.metadata, '{}'::jsonb)
     WHERE app_license_runtime_leases.expires_at <= NOW()
        OR app_license_runtime_leases.client_id = EXCLUDED.client_id
     RETURNING license_id, customer_id, app_id, client_type, client_id, client_name,
               acquired_at, last_seen_at, expires_at, metadata`,
    [
      license.id,
      license.customerId,
      license.appId,
      clientType,
      clientId,
      clientName || null,
      LICENSE_RUNTIME_LEASE_SECONDS,
    ]
  );

  if (result.rowCount > 0) {
    return { ok: true, lease: mapRuntimeLease(result.rows[0]) };
  }

  return {
    ok: false,
    concurrentUsage: true,
    activeLease: await findActiveLicenseRuntimeLease(license.id),
  };
}

async function releaseLicenseRuntimeLease({ licenseId, clientId = null }) {
  const params = [licenseId];
  let whereSql = "WHERE license_id = $1::uuid";

  if (clientId) {
    params.push(clientId);
    whereSql += ` AND client_id = $${params.length}`;
  }

  const result = await pool.query(
    `DELETE FROM app_license_runtime_leases
     ${whereSql}
     RETURNING license_id`,
    params
  );

  return result.rowCount > 0;
}

function generateReadableLicenseKey() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WSTL-${timePart}-${randomPart}`;
}

function computeLicenseExpiry(cycle) {
  if (cycle === "monthly") {
    const endAt = new Date();
    endAt.setMonth(endAt.getMonth() + 1);
    return endAt;
  }

  if (cycle === "yearly") {
    const endAt = new Date();
    endAt.setFullYear(endAt.getFullYear() + 1);
    return endAt;
  }

  return null;
}

async function getOrderAppLicense(orderId) {
  const result = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE order_id = $1::uuid`,
    [orderId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function issueAppLicenseForOrder({ client, order, product }) {
  const existedResult = await client.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE order_id = $1::uuid`,
    [order.id]
  );

  if (existedResult.rowCount > 0) {
    return mapAppLicense(existedResult.rows[0]);
  }

  const expiresAt = computeLicenseExpiry(product.cycle);
  const metadata = {
    source: "auto_after_paid",
    orderCode: order.order_code,
    cycle: product.cycle
  };

  if (String(product.id || "").trim().toLowerCase() === "prod-study-year") {
    metadata.planId = "standard_1year_3grade";
    metadata.basePlan = "standard";
    metadata.subjects = "all";
    metadata.grades = 3;
    metadata.profiles = 3;
  }

  if (String(product.id || "").trim().toLowerCase() === "standard_1year_1grade") {
    metadata.planId = "standard_1year_1grade";
    metadata.basePlan = "standard";
    metadata.subjects = "all";
    metadata.grades = 1;
    metadata.profiles = 2;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const licenseKey = generateReadableLicenseKey();
    try {
      const inserted = await client.query(
        `INSERT INTO app_licenses(
           id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle,
           license_key, status, expires_at, metadata
         )
         VALUES (
           gen_random_uuid(), $1, $2, $3, $4::uuid, $5, $6,
           $7, 'inactive', $8, $9::jsonb
         )
         RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                   status, activated_at, expires_at, device_id, device_name, last_verified_at,
                   metadata, created_at, updated_at`,
        [
          order.customer_id,
          order.app_id,
          order.product_id,
          order.id,
          product.id,
          product.cycle,
          licenseKey,
          expiresAt ? expiresAt.toISOString() : null,
          JSON.stringify(metadata)
        ]
      );

      return mapAppLicense(inserted.rows[0]);
    } catch (error) {
      const uniqueLicenseKeyConflict =
        error?.code === "23505" &&
        (String(error?.constraint || "").includes("license_key") ||
          String(error?.detail || "").includes("license_key"));
      if (!uniqueLicenseKeyConflict || attempt === 4) {
        throw error;
      }
    }
  }

  throw new Error("Khong the tao app license");
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

async function getCatalog({ includeHidden = false } = {}) {
  const appsResult = await pool.query(
    "SELECT id, name, slug, status, description FROM apps ORDER BY created_at ASC"
  );
  const visibilityWhere = includeHidden ? "" : "AND visibility = 'public'";
  const productsResult = await pool.query(
    `SELECT id, app_id, name, cycle, price, currency, credits, active, visibility
     FROM products
     WHERE active = TRUE
       ${visibilityWhere}
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
      active: row.active,
      visibility: row.visibility
    }))
  };
}

async function getPublicCatalog() {
  return getCatalog({ includeHidden: false });
}

async function getAdminCatalog() {
  return getCatalog({ includeHidden: true });
}

async function applyDiscountToOrderWithClient({ client, orderId, discountCode }) {
  const normalizedCode = normalizeDiscountCode(discountCode);
  if (!normalizedCode) {
    throw createStoreError("Vui lòng nhập mã giảm giá", 400);
  }

  const orderResult = await client.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
            discount_amount, discount_percent, discount_code, discount_code_id,
            currency, status, created_at, paid_at
     FROM orders
     WHERE id = $1::uuid
     FOR UPDATE`,
    [orderId]
  );
  if (orderResult.rowCount === 0) {
    throw createStoreError("Order không tồn tại", 404);
  }

  const order = orderResult.rows[0];
  if (String(order.status || "").toLowerCase() !== "pending") {
    throw createStoreError("Chỉ áp dụng mã cho đơn hàng đang chờ thanh toán", 400);
  }

  const codeResult = await client.query(
    `SELECT id, code, percent_off, starts_at, ends_at, active, single_use, note,
            created_at, updated_at, created_by_admin_id, used_at, used_order_id
     FROM discount_codes
     WHERE UPPER(code) = $1
     FOR UPDATE`,
    [normalizedCode]
  );
  if (codeResult.rowCount === 0) {
    throw createStoreError("Mã giảm giá không tồn tại", 404);
  }

  const code = codeResult.rows[0];
  const now = Date.now();
  const startsAt = new Date(code.starts_at).getTime();
  const endsAt = new Date(code.ends_at).getTime();
  if (!code.active) {
    throw createStoreError("Mã giảm giá đang tắt", 400);
  }
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt > now || endsAt < now) {
    throw createStoreError("Mã giảm giá đã hết hạn hoặc chưa đến thời gian áp dụng", 400);
  }
  if (code.used_order_id && code.used_order_id !== order.id) {
    throw createStoreError("Mã giảm giá này đã được sử dụng", 400);
  }

  const reservedResult = await client.query(
    `SELECT id, order_code, status
     FROM orders
     WHERE discount_code_id = $1::uuid
       AND id <> $2::uuid
       AND status IN ('pending', 'paid')
     ORDER BY created_at DESC
     LIMIT 1`,
    [code.id, order.id]
  );
  if (reservedResult.rowCount > 0) {
    const reservedOrder = reservedResult.rows[0];
    throw createStoreError(
      reservedOrder.status === "paid"
        ? "Mã giảm giá này đã được sử dụng"
        : "Mã giảm giá này đang được giữ bởi một đơn khác",
      400
    );
  }

  const subtotalAmount = Number(order.subtotal_amount ?? order.amount ?? 0);
  const discountAmount = computeDiscountAmount(subtotalAmount, code.percent_off);
  const finalAmount = Math.max(0, subtotalAmount - discountAmount);
  const updatedResult = await client.query(
    `UPDATE orders
     SET subtotal_amount = $2,
         amount = $3,
         discount_amount = $4,
         discount_percent = $5,
         discount_code_id = $6::uuid,
         discount_code = $7,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
               discount_amount, discount_percent, discount_code, discount_code_id,
               currency, status, created_at, paid_at`,
    [order.id, subtotalAmount, finalAmount, discountAmount, Number(code.percent_off), code.id, code.code]
  );

  return {
    order: mapOrder(updatedResult.rows[0]),
    discountCode: mapDiscountCode({
      ...code,
      usage_status: "reserved",
      reserved_order_id: order.id,
      reserved_order_code: order.order_code
    })
  };
}

async function createOrder({ customerId, appId, productId, discountCode }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      `SELECT id, app_id, name, cycle, price, currency, credits
       FROM products
       WHERE id = $1 AND app_id = $2 AND active = TRUE`,
      [productId, appId]
    );
    if (productResult.rowCount === 0) {
      throw createStoreError("Product khong ton tai hoac dang tat", 404);
    }

    const customerResult = await client.query("SELECT id FROM customers WHERE id = $1", [customerId]);
    if (customerResult.rowCount === 0) {
      throw createStoreError("Customer khong ton tai", 404);
    }

    const product = productResult.rows[0];
    let orderRow = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderCode = generateReadableOrderCode();
      try {
        const orderResult = await client.query(
          `INSERT INTO orders(
             id, order_code, customer_id, app_id, product_id,
             amount, subtotal_amount, discount_amount, discount_percent,
             currency, status
           )
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $5, 0, 0, $6, 'pending')
           RETURNING id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
                     discount_amount, discount_percent, discount_code, discount_code_id,
                     currency, status, created_at, paid_at`,
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

    if (discountCode) {
      const discounted = await applyDiscountToOrderWithClient({
        client,
        orderId: orderRow.id,
        discountCode
      });
      orderRow = {
        ...orderRow,
        ...discounted.order,
        order_code: discounted.order.orderCode,
        customer_id: discounted.order.customerId,
        app_id: discounted.order.appId,
        product_id: discounted.order.productId,
        subtotal_amount: discounted.order.subtotalAmount,
        discount_amount: discounted.order.discountAmount,
        discount_percent: discounted.order.discountPercent,
        discount_code: discounted.order.discountCode,
        currency: discounted.order.currency,
        created_at: discounted.order.createdAt,
        paid_at: discounted.order.paidAt
      };
    }

    await client.query("COMMIT");

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
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderById(orderId) {
  const result = await pool.query(
    `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
            discount_amount, discount_percent, discount_code, discount_code_id,
            currency, status, created_at, paid_at
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
    `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
            discount_amount, discount_percent, discount_code, discount_code_id,
            currency, status, created_at, paid_at
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

  const keyDelivery = order.status === "paid"
    ? await getOrderKeyDelivery(orderId)
    : null;
  return { order, keyDelivery };
}

async function applyDiscountToOrder({ orderId, discountCode }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const applied = await applyDiscountToOrderWithClient({ client, orderId, discountCode });
    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listDiscountCodes(limit = 200) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const result = await pool.query(
    `SELECT dc.id, dc.code, dc.percent_off, dc.starts_at, dc.ends_at, dc.active, dc.single_use,
            dc.note, dc.created_at, dc.updated_at, dc.created_by_admin_id, dc.used_at, dc.used_order_id,
            au.username AS created_by_username,
            used_order.order_code AS used_order_code,
            reserved_order.id AS reserved_order_id,
            reserved_order.order_code AS reserved_order_code,
            CASE
              WHEN dc.used_order_id IS NOT NULL THEN 'used'
              WHEN reserved_order.id IS NOT NULL THEN 'reserved'
              ELSE 'available'
            END AS usage_status
     FROM discount_codes dc
     LEFT JOIN admin_users au ON au.id = dc.created_by_admin_id
     LEFT JOIN orders used_order ON used_order.id = dc.used_order_id
     LEFT JOIN LATERAL (
       SELECT o.id, o.order_code
       FROM orders o
       WHERE o.discount_code_id = dc.id
         AND o.status = 'pending'
       ORDER BY o.created_at DESC
       LIMIT 1
     ) AS reserved_order ON TRUE
     ORDER BY dc.created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows.map(mapDiscountCode);
}

async function createDiscountCode({ code, percentOff, startsAt, endsAt, note, createdByAdminId }) {
  const normalizedCode = normalizeDiscountCode(code);
  const safePercentOff = Number(percentOff);
  const safeStartsAt = new Date(startsAt);
  const safeEndsAt = new Date(endsAt);
  const safeNote = String(note || "").trim();

  if (!normalizedCode || !/^[A-Z0-9_-]{4,40}$/.test(normalizedCode)) {
    throw createStoreError("Mã giảm giá chỉ gồm A-Z, số, gạch ngang hoặc gạch dưới, dài 4-40 ký tự", 400);
  }
  if (!Number.isInteger(safePercentOff) || safePercentOff <= 0 || safePercentOff >= 100) {
    throw createStoreError("Phần trăm giảm phải là số nguyên từ 1 đến 99", 400);
  }
  if (Number.isNaN(safeStartsAt.getTime()) || Number.isNaN(safeEndsAt.getTime()) || safeStartsAt >= safeEndsAt) {
    throw createStoreError("Khoảng thời gian áp dụng không hợp lệ", 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO discount_codes(
         id, code, percent_off, starts_at, ends_at, active, single_use,
         note, created_by_admin_id
       )
       VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE, TRUE, $5, $6::uuid)
       RETURNING id, code, percent_off, starts_at, ends_at, active, single_use,
                 note, created_at, updated_at, created_by_admin_id, used_at, used_order_id`,
      [
        normalizedCode,
        safePercentOff,
        safeStartsAt.toISOString(),
        safeEndsAt.toISOString(),
        safeNote || null,
        createdByAdminId || null
      ]
    );
    return mapDiscountCode(result.rows[0]);
  } catch (error) {
    const isConflict = error?.code === "23505";
    if (isConflict) {
      throw createStoreError("Mã giảm giá đã tồn tại", 409);
    }
    throw error;
  }
}

async function updateDiscountCodeActive({ discountCodeId, active }) {
  const result = await pool.query(
    `UPDATE discount_codes
     SET active = $2,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, code, percent_off, starts_at, ends_at, active, single_use,
               note, created_at, updated_at, created_by_admin_id, used_at, used_order_id`,
    [discountCodeId, Boolean(active)]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapDiscountCode(result.rows[0]);
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
      `SELECT id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
              discount_amount, discount_percent, discount_code, discount_code_id,
              currency, status, created_at, paid_at
       FROM orders
       WHERE id = $1::uuid
       FOR UPDATE`,
      [orderId]
    );
    if (orderResult.rowCount === 0) {
      throw new Error("Order khong ton tai");
    }

    const orderRow = orderResult.rows[0];
    if (orderRow.discount_code_id) {
      const discountLock = await client.query(
        `SELECT id, used_order_id
         FROM discount_codes
         WHERE id = $1::uuid
         FOR UPDATE`,
        [orderRow.discount_code_id]
      );
      if (discountLock.rowCount === 0) {
        throw createStoreError("Mã giảm giá đã gắn với đơn không còn tồn tại", 400);
      }
      const discountRow = discountLock.rows[0];
      if (discountRow.used_order_id && discountRow.used_order_id !== orderId) {
        throw createStoreError("Mã giảm giá này đã được dùng cho đơn khác", 400);
      }
    }

    if (orderRow.status === "paid") {
      const existingDelivery = await getOrderKeyDelivery(orderId);
      const existingLicense = await getOrderAppLicense(orderId);
      await client.query("COMMIT");
      return {
        order: mapOrder(orderRow),
        keyDelivery: existingDelivery,
        appLicense: existingLicense,
        idempotent: true
      };
    }

    const txResult = await client.query(
      `INSERT INTO payment_transactions(id, order_id, provider, provider_transaction_id, amount, status, payload)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, 'paid', $5::jsonb)
       ON CONFLICT (provider_transaction_id) DO NOTHING
       RETURNING id`,
      [orderId, provider, providerTransactionId, orderRow.amount, JSON.stringify(payload)]
    );

    if (txResult.rowCount === 0) {
      const existingLicense = await getOrderAppLicense(orderId);
      await client.query("COMMIT");
      return { order: mapOrder(orderRow), appLicense: existingLicense, idempotent: true };
    }

    const paidOrderResult = await client.query(
      `UPDATE orders
       SET status = 'paid', paid_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, order_code, customer_id, app_id, product_id, amount, subtotal_amount,
                 discount_amount, discount_percent, discount_code, discount_code_id,
                 currency, status, created_at, paid_at`,
      [orderId]
    );
    const paidOrder = paidOrderResult.rows[0];

    if (paidOrder.discount_code_id) {
      await client.query(
        `UPDATE discount_codes
         SET used_at = COALESCE(used_at, NOW()),
             used_order_id = COALESCE(used_order_id, $2::uuid),
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [paidOrder.discount_code_id, paidOrder.id]
      );
    }

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

    const appLicense = await issueAppLicenseForOrder({
      client,
      order: paidOrder,
      product
    });

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
    return { order: mapOrder(paidOrder), keyDelivery, appLicense, idempotent: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listCustomerLicenses({ customerId, appId }) {
  const params = [customerId];
  let whereSql = "WHERE customer_id = $1";

  if (appId) {
    params.push(appId);
    whereSql += ` AND app_id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     ${whereSql}
     ORDER BY created_at DESC`,
    params
  );

  return result.rows.map(mapAppLicense);
}

async function activateCustomerLicense({ licenseId, customerId, deviceId, deviceName, clientId = null, clientType = "desktop" }) {
  const incomingDeviceId = normalizeRuntimeClientId(deviceId);
  const runtimeClientId = normalizeRuntimeClientId(clientId || incomingDeviceId);
  const normalizedClientProfile = normalizeRuntimeClientProfile(clientType);
  const runtimeClientName = String(deviceName || "").trim() || null;

  const existingResult = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [licenseId, customerId]
  );

  if (existingResult.rowCount === 0) {
    return null;
  }

  const existingLicense = mapAppLicense(existingResult.rows[0]);

  if (runtimeClientId) {
    const lease = await claimOrRenewLicenseRuntimeLease({
      license: existingLicense,
      clientId: runtimeClientId,
      clientType: normalizedClientProfile,
      clientName: runtimeClientName,
    });

    if (!lease.ok) {
      return {
        concurrentUsage: true,
        activeLease: lease.activeLease,
      };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = 'active',
         activated_at = COALESCE(activated_at, NOW()),
         last_verified_at = NOW(),
         device_id = CASE
           WHEN $5 = 'desktop' AND $3 IS NOT NULL THEN COALESCE(device_id, $3)
           ELSE device_id
         END,
         device_name = CASE
           WHEN $5 = 'desktop' AND $4 IS NOT NULL THEN COALESCE(device_name, $4)
           ELSE device_name
         END,
         updated_at = NOW()
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId, customerId, incomingDeviceId, runtimeClientName, normalizedClientProfile]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function verifyCustomerLicense({ licenseId, customerId, deviceId, deviceName, clientId = null, clientType = "desktop" }) {
  const incomingDeviceId = normalizeRuntimeClientId(deviceId);
  const runtimeClientId = normalizeRuntimeClientId(clientId || incomingDeviceId);
  const normalizedClientProfile = normalizeRuntimeClientProfile(clientType);
  const runtimeClientName = String(deviceName || "").trim() || null;

  const existingResult = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1`,
    [licenseId, customerId]
  );

  if (existingResult.rowCount === 0) {
    return null;
  }

  const existingLicense = mapAppLicense(existingResult.rows[0]);

  if (runtimeClientId) {
    const lease = await claimOrRenewLicenseRuntimeLease({
      license: existingLicense,
      clientId: runtimeClientId,
      clientType: normalizedClientProfile,
      clientName: runtimeClientName,
    });

    if (!lease.ok) {
      return {
        concurrentUsage: true,
        activeLease: lease.activeLease,
      };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END,
         activated_at = CASE WHEN activated_at IS NULL THEN NOW() ELSE activated_at END,
         last_verified_at = NOW(),
         device_id = CASE
           WHEN $5 = 'desktop' AND $3 IS NOT NULL THEN COALESCE(device_id, $3)
           ELSE device_id
         END,
         device_name = CASE
           WHEN $5 = 'desktop' AND $4 IS NOT NULL THEN COALESCE(device_name, $4)
           ELSE device_name
         END,
         updated_at = NOW()
     WHERE id = $1::uuid AND customer_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId, customerId, incomingDeviceId, runtimeClientName, normalizedClientProfile]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function findAppLicenseByKey({ appId, licenseKey, customerId }) {
  const normalizedLicenseKey = String(licenseKey || "").trim().toUpperCase();
  if (!normalizedLicenseKey) {
    return null;
  }

  const params = [normalizedLicenseKey, appId];
  let whereSql = "WHERE license_key = $1 AND app_id = $2 AND status <> 'revoked'";

  if (customerId) {
    params.push(customerId);
    whereSql += ` AND customer_id = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
            status, activated_at, expires_at, device_id, device_name, last_verified_at,
            metadata, created_at, updated_at
     FROM app_licenses
     ${whereSql}
     LIMIT 1`,
    params
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

async function findAppLicenseByKeyAdmin(licenseKey) {
  const normalizedKey = String(licenseKey || "").trim().toUpperCase();
  if (!normalizedKey) return null;

  const result = await pool.query(
    `SELECT al.id, al.customer_id, al.app_id, al.product_id, al.order_id,
            al.plan_code, al.billing_cycle, al.license_key,
            al.status, al.activated_at, al.expires_at, al.device_id, al.device_name,
            al.last_verified_at, al.metadata, al.created_at, al.updated_at,
            rtl.license_id AS lease_license_id,
            rtl.customer_id AS lease_customer_id,
            rtl.app_id AS lease_app_id,
            rtl.client_type AS lease_client_type,
            rtl.client_id AS lease_client_id,
            rtl.client_name AS lease_client_name,
            rtl.acquired_at AS lease_acquired_at,
            rtl.last_seen_at AS lease_last_seen_at,
            rtl.expires_at AS lease_expires_at,
            rtl.metadata AS lease_metadata
     FROM app_licenses al
     LEFT JOIN app_license_runtime_leases rtl
       ON rtl.license_id = al.id
      AND rtl.expires_at > NOW()
     WHERE al.license_key = $1
     LIMIT 1`,
    [normalizedKey]
  );

  if (result.rowCount === 0) return null;
  return mapAppLicense(result.rows[0]);
}

async function revokeAppLicenseAdmin(licenseId) {
  const result = await pool.query(
    `UPDATE app_licenses
     SET status = 'revoked',
         updated_at = NOW()
     WHERE id = $1::uuid AND status <> 'revoked'
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId]
  );
  if (result.rowCount === 0) return null;
  await releaseLicenseRuntimeLease({ licenseId });
  return mapAppLicense(result.rows[0]);
}

async function deactivateCustomerLicense({ licenseId, customerId, clientId = null, enforceRuntimeLease = false }) {
  if (enforceRuntimeLease) {
    const activeLease = await findActiveLicenseRuntimeLease(licenseId);
    if (activeLease && activeLease.clientId !== clientId) {
      return { leaseMismatch: true, activeLease };
    }
    if (activeLease && !clientId) {
      return { leaseMismatch: true, activeLease };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = 'inactive',
         device_id = NULL,
         device_name = NULL,
         updated_at = NOW()
     WHERE id = $1::uuid AND customer_id = $2 AND status <> 'revoked'
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [licenseId, customerId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  await releaseLicenseRuntimeLease({ licenseId, clientId: clientId || null });

  return mapAppLicense(result.rows[0]);
}

async function verifyAppLicenseByKey({ appId, licenseKey, customerId, deviceId, deviceName, clientProfile }) {
  const normalizedLicenseKey = String(licenseKey || "").trim().toUpperCase();
  if (!normalizedLicenseKey) {
    return null;
  }

  const existingLicense = await findAppLicenseByKey({ appId, licenseKey: normalizedLicenseKey, customerId });
  if (!existingLicense) {
    return null;
  }

  const normalizedClientProfile = normalizeRuntimeClientProfile(clientProfile);
  const runtimeClientId = normalizeRuntimeClientId(deviceId);
  const runtimeClientName = String(deviceName || "").trim() || null;

  if (runtimeClientId) {
    const lease = await claimOrRenewLicenseRuntimeLease({
      license: existingLicense,
      clientId: runtimeClientId,
      clientType: normalizedClientProfile,
      clientName: runtimeClientName,
    });

    if (!lease.ok) {
      return {
        concurrentUsage: true,
        activeLease: lease.activeLease,
      };
    }
  }

  const result = await pool.query(
    `UPDATE app_licenses
     SET status = CASE WHEN status = 'inactive' THEN 'active' ELSE status END,
         activated_at = CASE WHEN activated_at IS NULL THEN NOW() ELSE activated_at END,
         last_verified_at = NOW(),
         device_id = CASE
           WHEN $5 = 'desktop' AND $3 IS NOT NULL THEN $3
           ELSE device_id
         END,
         device_name = CASE
           WHEN $5 = 'desktop' AND $4 IS NOT NULL THEN $4
           ELSE device_name
         END,
         updated_at = NOW()
     WHERE license_key = $1 AND app_id = $2
       AND status <> 'revoked'
       AND (expires_at IS NULL OR expires_at > NOW())
     RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
               status, activated_at, expires_at, device_id, device_name, last_verified_at,
               metadata, created_at, updated_at`,
    [normalizedLicenseKey, appId, runtimeClientId, runtimeClientName, normalizedClientProfile]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapAppLicense(result.rows[0]);
}

function normalizeStandardGrades(grades) {
  if (!Array.isArray(grades)) {
    return [];
  }

  const unique = [];
  for (const item of grades) {
    const grade = Number(item);
    if (!Number.isInteger(grade)) {
      continue;
    }
    if (grade < 0 || grade > 12) {
      continue;
    }
    if (!unique.includes(grade)) {
      unique.push(grade);
    }
  }
  return unique.sort((a, b) => a - b);
}

function sameGradeSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

async function lockAppLicenseStandardGradesByKey({ appId, licenseKey, customerId, selectedGrades, requiredGradeCount }) {
  const normalizedLicenseKey = String(licenseKey || "").trim().toUpperCase();
  const normalizedAppId = String(appId || "").trim();
  const normalizedSelectedGrades = normalizeStandardGrades(selectedGrades);
  const normalizedRequired = Number(requiredGradeCount);

  if (!normalizedLicenseKey || !normalizedAppId) {
    return null;
  }
  if (!Number.isInteger(normalizedRequired) || normalizedRequired <= 0) {
    throw new Error("requiredGradeCount must be a positive integer");
  }
  if (normalizedSelectedGrades.length !== normalizedRequired) {
    throw new Error("selectedGrades does not match requiredGradeCount");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const params = [normalizedLicenseKey, normalizedAppId];
    let customerClause = "";
    if (customerId) {
      params.push(String(customerId).trim());
      customerClause = `AND customer_id = $${params.length}`;
    }

    const checkResult = await client.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE license_key = $1 AND app_id = $2
         ${customerClause}
         AND status <> 'revoked'
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1
       FOR UPDATE`,
      params
    );

    if (checkResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const row = checkResult.rows[0];
    const metadata = (row.metadata && typeof row.metadata === "object") ? row.metadata : {};
    const existingGrades = normalizeStandardGrades(metadata.standardGrades);
    const existingRequired = Number(metadata.standardGradesRequiredCount || 0);

    if (existingGrades.length > 0) {
      if (!sameGradeSet(existingGrades, normalizedSelectedGrades)) {
        await client.query("ROLLBACK");
        return {
          gradeMismatch: true,
          lockedGrades: existingGrades,
          requiredGradeCount: existingRequired > 0 ? existingRequired : existingGrades.length,
          license: mapAppLicense(row)
        };
      }

      await client.query("COMMIT");
      return {
        gradeMismatch: false,
        lockedGrades: existingGrades,
        requiredGradeCount: existingRequired > 0 ? existingRequired : existingGrades.length,
        license: mapAppLicense(row)
      };
    }

    const nextMetadata = {
      ...metadata,
      standardGrades: normalizedSelectedGrades,
      standardGradesRequiredCount: normalizedRequired,
      standardGradesLockedAt: new Date().toISOString()
    };

    const updateResult = await client.query(
      `UPDATE app_licenses
       SET metadata = $2::jsonb,
           updated_at = NOW(),
           last_verified_at = NOW()
       WHERE id = $1::uuid
       RETURNING id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
                 status, activated_at, expires_at, device_id, device_name, last_verified_at,
                 metadata, created_at, updated_at`,
      [row.id, JSON.stringify(nextMetadata)]
    );

    await client.query("COMMIT");
    return {
      gradeMismatch: false,
      lockedGrades: normalizedSelectedGrades,
      requiredGradeCount: normalizedRequired,
      license: mapAppLicense(updateResult.rows[0])
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }
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
  const [customer, orders, subscriptions, entitlements, wallets, ledger, usageLogs, keyDeliveries, licenses] = await Promise.all([
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
    ),
    pool.query(
      `SELECT id, customer_id, app_id, product_id, order_id, plan_code, billing_cycle, license_key,
              status, activated_at, expires_at, device_id, device_name, last_verified_at,
              metadata, created_at, updated_at
       FROM app_licenses
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
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
    keyDeliveries: keyDeliveries.rows.map(mapKeyDelivery),
    licenses: licenses.rows.map(mapAppLicense)
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

async function findCustomerById(customerId) {
  const normalizedCustomerId = String(customerId || "").trim();
  if (!normalizedCustomerId) {
    return null;
  }

  const result = await pool.query(
    "SELECT id, email, full_name, password_hash FROM customers WHERE id = $1",
    [normalizedCustomerId]
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

async function ensureAdminLoginSecuritySchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_login_guards (
      dimension TEXT NOT NULL,
      subject TEXT NOT NULL,
      fail_count INT NOT NULL DEFAULT 0,
      first_failed_at TIMESTAMPTZ,
      lock_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admin_login_guards_pk PRIMARY KEY (dimension, subject),
      CONSTRAINT admin_login_guards_dimension_check CHECK (dimension IN ('ip', 'username', 'pair'))
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_guards_lock_until
      ON admin_login_guards(lock_until)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_login_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      username TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      login_method TEXT NOT NULL,
      outcome TEXT NOT NULL,
      reason TEXT,
      admin_user_id UUID REFERENCES admin_users(id),
      role TEXT,
      requires_otp BOOLEAN NOT NULL DEFAULT FALSE,
      otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT admin_login_audits_method_check CHECK (login_method IN ('password', 'owner_key')),
      CONSTRAINT admin_login_audits_outcome_check CHECK (outcome IN ('success', 'failure', 'blocked', 'challenge'))
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_audits_attempted_at
      ON admin_login_audits(attempted_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_audits_username
      ON admin_login_audits(username)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_login_audits_ip
      ON admin_login_audits(ip_address)
  `);
}

function normalizeGuardValue(value) {
  return String(value || "").trim().toLowerCase();
}

function guardPairSubject(ipAddress, username) {
  return `${normalizeGuardValue(ipAddress)}|${normalizeGuardValue(username)}`;
}

async function getAdminLoginBlockState({ ipAddress, username }) {
  const safeIp = normalizeGuardValue(ipAddress) || "unknown";
  const safeUsername = normalizeGuardValue(username);
  const pair = guardPairSubject(safeIp, safeUsername || "_");

  const result = await pool.query(
    `SELECT dimension, lock_until
     FROM admin_login_guards
     WHERE lock_until IS NOT NULL
       AND lock_until > NOW()
       AND (
         (dimension = 'ip' AND subject = $1)
         OR (dimension = 'username' AND subject = $2)
         OR (dimension = 'pair' AND subject = $3)
       )
     ORDER BY lock_until DESC`,
    [safeIp, safeUsername, pair]
  );

  if (result.rowCount === 0) {
    return { blocked: false, retryAfterSeconds: 0, dimensions: [] };
  }

  const lockUntil = new Date(result.rows[0].lock_until).getTime();
  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000)),
    dimensions: result.rows.map((row) => row.dimension)
  };
}

async function upsertAdminLoginGuard({ dimension, subject, windowMs, maxAttempts, lockoutMs }) {
  if (!subject) {
    return;
  }

  const existing = await pool.query(
    `SELECT fail_count, first_failed_at, lock_until
     FROM admin_login_guards
     WHERE dimension = $1 AND subject = $2`,
    [dimension, subject]
  );

  const now = Date.now();
  if (existing.rowCount === 0) {
    const lockUntil = maxAttempts <= 1 ? new Date(now + lockoutMs) : null;
    await pool.query(
      `INSERT INTO admin_login_guards(dimension, subject, fail_count, first_failed_at, lock_until, updated_at)
       VALUES ($1, $2, 1, NOW(), $3, NOW())`,
      [dimension, subject, lockUntil]
    );
    return;
  }

  const row = existing.rows[0];
  const firstFailedAt = row.first_failed_at ? new Date(row.first_failed_at).getTime() : 0;
  const withinWindow = firstFailedAt > 0 && now - firstFailedAt <= windowMs;
  const nextFailCount = withinWindow ? Number(row.fail_count || 0) + 1 : 1;
  const nextFirstFailedAt = withinWindow ? new Date(firstFailedAt) : new Date(now);
  const currentLockUntil = row.lock_until ? new Date(row.lock_until).getTime() : 0;
  const nextLockUntil = nextFailCount >= maxAttempts
    ? new Date(now + lockoutMs)
    : currentLockUntil > now
      ? new Date(currentLockUntil)
      : null;

  await pool.query(
    `UPDATE admin_login_guards
     SET fail_count = $3,
         first_failed_at = $4,
         lock_until = $5,
         updated_at = NOW()
     WHERE dimension = $1 AND subject = $2`,
    [dimension, subject, nextFailCount, nextFirstFailedAt, nextLockUntil]
  );
}

async function registerAdminLoginFailureGuard({ ipAddress, username, windowMs, maxAttempts, lockoutMs }) {
  const safeIp = normalizeGuardValue(ipAddress) || "unknown";
  const safeUsername = normalizeGuardValue(username);

  await upsertAdminLoginGuard({
    dimension: "ip",
    subject: safeIp,
    windowMs,
    maxAttempts,
    lockoutMs
  });

  if (safeUsername) {
    await upsertAdminLoginGuard({
      dimension: "username",
      subject: safeUsername,
      windowMs,
      maxAttempts,
      lockoutMs
    });

    await upsertAdminLoginGuard({
      dimension: "pair",
      subject: guardPairSubject(safeIp, safeUsername),
      windowMs,
      maxAttempts,
      lockoutMs
    });
  }
}

async function clearAdminLoginFailureGuard({ ipAddress, username }) {
  const safeIp = normalizeGuardValue(ipAddress) || "unknown";
  const safeUsername = normalizeGuardValue(username);

  if (!safeUsername) {
    return;
  }

  await pool.query(
    `UPDATE admin_login_guards
     SET fail_count = 0,
         first_failed_at = NULL,
         lock_until = NULL,
         updated_at = NOW()
     WHERE (dimension = 'username' AND subject = $1)
        OR (dimension = 'pair' AND subject = $2)`,
    [safeUsername, guardPairSubject(safeIp, safeUsername)]
  );
}

async function recordAdminLoginAudit({
  username,
  ipAddress,
  userAgent,
  loginMethod,
  outcome,
  reason,
  adminUserId,
  role,
  requiresOtp,
  otpVerified,
  metadata
}) {
  await pool.query(
    `INSERT INTO admin_login_audits(
      username,
      ip_address,
      user_agent,
      login_method,
      outcome,
      reason,
      admin_user_id,
      role,
      requires_otp,
      otp_verified,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8, $9, $10, $11::jsonb)`,
    [
      normalizeGuardValue(username) || null,
      normalizeGuardValue(ipAddress) || "unknown",
      String(userAgent || "").slice(0, 500) || null,
      String(loginMethod || "password"),
      String(outcome || "failure"),
      reason ? String(reason).slice(0, 500) : null,
      adminUserId || null,
      role ? String(role) : null,
      Boolean(requiresOtp),
      Boolean(otpVerified),
      JSON.stringify(metadata || {})
    ]
  );
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

async function updateAdminPasswordById({ adminId, passwordHash }) {
  const result = await pool.query(
    `UPDATE admin_users
     SET password_hash = $2,
         updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id, username, email, role, permissions, is_active, created_by, created_at, last_login_at`,
    [adminId, passwordHash]
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

async function ensureRuntimeConfigSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS runtime_configs (
      config_key TEXT PRIMARY KEY,
      config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getRuntimeConfigValue(configKey) {
  const key = String(configKey || "").trim();
  if (!key) {
    return null;
  }

  await ensureRuntimeConfigSchema();
  const result = await pool.query(
    `SELECT config_value
     FROM runtime_configs
     WHERE config_key = $1`,
    [key]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0].config_value || null;
}

async function upsertRuntimeConfigValue(configKey, configValue) {
  const key = String(configKey || "").trim();
  if (!key) {
    throw new Error("config_key is required");
  }

  await ensureRuntimeConfigSchema();
  const payload = (configValue && typeof configValue === "object") ? configValue : {};
  const result = await pool.query(
    `INSERT INTO runtime_configs(config_key, config_value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (config_key)
     DO UPDATE SET
       config_value = EXCLUDED.config_value,
       updated_at = NOW()
     RETURNING config_value, updated_at`,
    [key, JSON.stringify(payload)]
  );

  return {
    value: result.rows[0]?.config_value || {},
    updatedAt: result.rows[0]?.updated_at || null
  };
}

async function searchCustomersByEmail(q, limit = 50) {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 200 ? limit : 50;
  const normalizedQuery = String(q || "").trim().toLowerCase();
  const pattern = `%${normalizedQuery}%`;
  const compact = normalizedQuery.replace(/[^a-z0-9]/g, "");
  const compactPattern = compact.length >= 4 ? `%${compact}%` : null;

  const result = await pool.query(
    `SELECT DISTINCT c.id, c.email, c.full_name, c.created_at
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     LEFT JOIN app_licenses al ON al.customer_id = c.id
     WHERE LOWER(c.email) LIKE $1
        OR LOWER(c.full_name) LIKE $1
        OR LOWER(c.id) LIKE $1
        OR LOWER(COALESCE(c.telegram_username, '')) LIKE $1
        OR LOWER(COALESCE(o.order_code, '')) LIKE $1
        OR LOWER(COALESCE(al.license_key, '')) LIKE $1
        OR ($2::text IS NOT NULL AND REPLACE(LOWER(COALESCE(o.order_code, '')), '-', '') LIKE $2)
        OR ($2::text IS NOT NULL AND REPLACE(LOWER(COALESCE(al.license_key, '')), '-', '') LIKE $2)
     ORDER BY c.created_at DESC
     LIMIT $3`,
    [pattern, compactPattern, safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at
  }));
}

async function updateCustomerById({ customerId, fullName }) {
  const safeName = String(fullName || "").trim();
  if (!safeName) {
    const err = new Error("fullName kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng");
    err.statusCode = 400;
    throw err;
  }
  const result = await pool.query(
    `UPDATE customers SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name, created_at`,
    [safeName, customerId]
  );
  if (result.rowCount === 0) {
    const err = new Error("Kh\u00f4ng t\u00ecm th\u1ea5y kh\u00e1ch h\u00e0ng");
    err.statusCode = 404;
    throw err;
  }
  const row = result.rows[0];
  return { id: row.id, email: row.email, fullName: row.full_name, createdAt: row.created_at };
}

async function deleteCustomerById(customerId) {
  const orderCheck = await pool.query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE customer_id = $1",
    [customerId]
  );
  const orderCount = Number(orderCheck.rows[0]?.cnt || 0);
  if (orderCount > 0) {
    const err = new Error(`Kh\u00f4ng th\u1ec3 x\u00f3a: kh\u00e1ch h\u00e0ng c\u00f3 ${orderCount} \u0111\u01a1n h\u00e0ng trong h\u1ec7 th\u1ed1ng`);
    err.statusCode = 409;
    throw err;
  }
  const result = await pool.query(
    "DELETE FROM customers WHERE id = $1 RETURNING id",
    [customerId]
  );
  if (result.rowCount === 0) {
    const err = new Error("Kh\u00f4ng t\u00ecm th\u1ea5y kh\u00e1ch h\u00e0ng");
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true, customerId };
}

async function manualGrantLicense({ customerEmail, productId, adminNote }) {
  const normalizedEmail = String(customerEmail || "").trim().toLowerCase();
  if (!normalizedEmail) {
    const err = new Error("customerEmail là bắt buộc");
    err.statusCode = 400;
    throw err;
  }

  const customerResult = await pool.query(
    "SELECT id, email FROM customers WHERE email = $1",
    [normalizedEmail]
  );
  if (customerResult.rowCount === 0) {
    const err = new Error(`Không tìm thấy khách hàng với email ${normalizedEmail}`);
    err.statusCode = 404;
    throw err;
  }
  const customer = customerResult.rows[0];

  const safeProductId = String(productId || "").trim();
  const productResult = await pool.query(
    `SELECT id, app_id, name, cycle, price, currency, credits
     FROM products
     WHERE id = $1 AND active = TRUE`,
    [safeProductId]
  );
  if (productResult.rowCount === 0) {
    const err = new Error(`Không tìm thấy sản phẩm "${safeProductId}" hoặc sản phẩm đã ngừng bán`);
    err.statusCode = 404;
    throw err;
  }
  const productRow = productResult.rows[0];
  const product = {
    id: productRow.id,
    appId: productRow.app_id,
    name: productRow.name,
    cycle: productRow.cycle,
    price: Number(productRow.price),
    currency: productRow.currency,
    credits: Number(productRow.credits)
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let orderRow = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderCode = generateReadableOrderCode();
      try {
        const orderResult = await client.query(
          `INSERT INTO orders(id, order_code, customer_id, app_id, product_id, amount, currency, status, paid_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, $5, 'paid', NOW())
           RETURNING id, order_code, customer_id, app_id, product_id, amount, currency, status, paid_at`,
          [orderCode, customer.id, product.appId, product.id, product.currency]
        );
        orderRow = orderResult.rows[0];
        break;
      } catch (error) {
        const uniqueConflict =
          error?.code === "23505" &&
          (String(error?.constraint || "").includes("order_code") ||
            String(error?.detail || "").includes("order_code"));
        if (!uniqueConflict || attempt === 4) {
          throw error;
        }
      }
    }

    const order = {
      id: orderRow.id,
      order_code: orderRow.order_code,
      customer_id: orderRow.customer_id,
      app_id: orderRow.app_id,
      product_id: orderRow.product_id
    };

    const license = await issueAppLicenseForOrder({ client, order, product });

    // Override source metadata so manual grants are distinguishable from auto grants
    await client.query(
      `UPDATE app_licenses
       SET metadata = metadata || $1::jsonb
       WHERE id = $2::uuid`,
      [JSON.stringify({ source: "manual_grant", adminNote: adminNote || "" }), license.id]
    );

    await client.query("COMMIT");

    return {
      licenseKey: license.licenseKey,
      orderId: order.id,
      orderCode: orderRow.order_code,
      customerId: customer.id,
      customerEmail: customer.email,
      appId: product.appId,
      productId: product.id,
      productName: product.name,
      planCode: product.id,
      billingCycle: product.cycle,
      expiresAt: license.expiresAt
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getPublicCatalog,
  getAdminCatalog,
  createOrder,
  applyDiscountToOrder,
  getOrderById,
  getOrderByCode,
  getOrderDetailsById,
  markOrderPaid,
  consumeUsage,
  recordWebhookEvent,
  getOrderKeyDelivery,
  getCustomerSnapshot,
  getOrderAppLicense,
  listCustomerLicenses,
  activateCustomerLicense,
  verifyCustomerLicense,
  deactivateCustomerLicense,
  findAppLicenseByKey,
  findAppLicenseByKeyAdmin,
  verifyAppLicenseByKey,
  lockAppLicenseStandardGradesByKey,
  getAdminDashboard,
  findOrCreateCustomerByEmail,
  createCustomerAccount,
  findCustomerById,
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
  ensureAdminLoginSecuritySchema,
  getAdminLoginBlockState,
  registerAdminLoginFailureGuard,
  clearAdminLoginFailureGuard,
  recordAdminLoginAudit,
  findAdminByUsername,
  findAdminById,
  markAdminLoginSuccess,
  createAdminUser,
  listAdminUsers,
  countActiveOwners,
  updateAdminUserById,
  updateAdminPasswordById,
  ensureRuntimeConfigSchema,
  getRuntimeConfigValue,
  upsertRuntimeConfigValue,
  searchCustomersByEmail,
  updateCustomerById,
  deleteCustomerById,
  manualGrantLicense,
  revokeAppLicenseAdmin,
  listProductKeySummary,
  listProductKeys,
  bulkImportProductKeys,
  deleteProductKey,
  listDiscountCodes,
  createDiscountCode,
  updateDiscountCodeActive
};

async function listProductKeySummary() {
  const result = await pool.query(
    `SELECT p.id AS product_id, p.name AS product_name, p.app_id,
            COUNT(k.id) FILTER (WHERE k.status = 'available') AS available,
            COUNT(k.id) FILTER (WHERE k.status = 'delivered') AS delivered,
            COUNT(k.id) AS total
     FROM products p
     LEFT JOIN product_keys k ON k.product_id = p.id
     GROUP BY p.id, p.name, p.app_id
     ORDER BY p.app_id, p.id`
  );
  return result.rows.map(r => ({
    productId: r.product_id,
    productName: r.product_name,
    appId: r.app_id,
    available: Number(r.available),
    delivered: Number(r.delivered),
    total: Number(r.total)
  }));
}

async function listProductKeys(productId, { status = null, limit = 200, offset = 0 } = {}) {
  const params = [productId];
  let statusClause = "";
  if (status) {
    params.push(status);
    statusClause = `AND status = $${params.length}`;
  }
  params.push(limit, offset);
  const result = await pool.query(
    `SELECT id, product_id, key_value, status, created_at, updated_at
     FROM product_keys
     WHERE product_id = $1 ${statusClause}
     ORDER BY created_at ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    keyValue: r.key_value,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

async function bulkImportProductKeys(productId, keyValues) {
  const unique = [...new Set(keyValues.map(k => String(k).trim()).filter(Boolean))];
  if (!unique.length) return { inserted: 0, skipped: 0 };
  let inserted = 0;
  let skipped = 0;
  for (const kv of unique) {
    const r = await pool.query(
      `INSERT INTO product_keys (id, product_id, key_value, status)
       VALUES (gen_random_uuid(), $1, $2, 'available')
       ON CONFLICT (key_value) DO NOTHING`,
      [productId, kv]
    );
    if (r.rowCount > 0) inserted++;
    else skipped++;
  }
  return { inserted, skipped };
}

async function deleteProductKey(keyId) {
  const result = await pool.query(
    `DELETE FROM product_keys
     WHERE id = $1::uuid AND status = 'available'
     RETURNING id, key_value, product_id`,
    [keyId]
  );
  if (result.rowCount === 0) return null;
  return {
    id: result.rows[0].id,
    keyValue: result.rows[0].key_value,
    productId: result.rows[0].product_id
  };
}
