const { env } = require("../config/env");
const { recordWebhookEvent, markOrderPaid, getOrderByCode } = require("./store");
const { getSepayRuntimeSettings, readRuntimeSettings } = require("../config/runtimeSettings");
const { pool } = require("../db/pool");

const EMAIL_EVENT_PAID_ORDER_SUCCESS = "paid_order_success";
const PAID_ORDER_EMAIL_RESEND_WINDOW_MINUTES = 10;

function getPaymentProviderMode() {
  const runtime = readRuntimeSettings();
  return runtime.paymentProviderMode || env.paymentProviderMode;
}

function getSepayConfig() {
  const runtime = getSepayRuntimeSettings();
  return {
    webhookSecret: runtime.webhookSecret || env.sepayWebhookSecret,
    bankCode: runtime.bankCode || env.sepayBankCode,
    bankAccountNumber: runtime.bankAccountNumber || env.sepayBankAccountNumber,
    accountName: runtime.accountName || env.sepayAccountName,
    qrTemplateUrl: runtime.qrTemplateUrl || env.sepayQrTemplateUrl
  };
}

function isTelegramNotifyEnabled() {
  return env.telegramNotifyEnabled && Boolean(env.telegramBotToken);
}

function isGmailNotifyEnabled() {
  return (
    env.gmailNotifyEnabled &&
    Boolean(env.googleClientId) &&
    Boolean(env.googleClientSecret) &&
    Boolean(env.googleRefreshToken) &&
    Boolean(resolveGmailSender())
  );
}

function resolveGmailSender() {
  return String(env.gmailNotifyFrom || env.smtpFrom || "").trim();
}

function resolveGmailRecipients() {
  const recipients = String(env.gmailNotifyTo || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (recipients.length > 0) {
    return recipients;
  }

  const sender = resolveGmailSender();
  return sender ? [sender] : [];
}

function maskKeyValue(keyValue) {
  if (!keyValue || keyValue.length < 8) {
    return "********";
  }
  return `${keyValue.slice(0, 4)}****${keyValue.slice(-4)}`;
}

async function sendTelegramMessage({ text, chatId }) {
  if (!env.telegramBotToken) {
    return { ok: false, skipped: true, reason: "missing_bot_token" };
  }
  const targetChatId = chatId || env.telegramChatId;
  if (!targetChatId) {
    return { ok: false, skipped: true, reason: "missing_chat_id" };
  }

  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      skipped: false,
      reason: payload?.description || `http_${response.status}`
    };
  }

  return {
    ok: true,
    skipped: false,
    messageId: payload?.result?.message_id || null,
    chatId: payload?.result?.chat?.id || targetChatId
  };
}

function buildTelegramPaidMessage({ order, keyDelivery }) {
  const orderId = order?.orderCode || order?.id || "(unknown)";
  const appId = order?.appId || "(unknown)";
  const customerId = order?.customerId || "(unknown)";
  const amount = Number(order?.amount || 0).toLocaleString("vi-VN");
  const currency = order?.currency || "VND";

  const keyValue = keyDelivery?.keyValue || "(chưa cấp key)";
  const keyText = env.telegramIncludeKey ? keyValue : maskKeyValue(keyValue);

  return [
    "✅ <b>Thanh toán thành công</b>",
    `• Order: <code>${orderId}</code>`,
    `• Customer: <code>${customerId}</code>`,
    `• App: <code>${appId}</code>`,
    `• Số tiền: <b>${amount} ${currency}</b>`,
    `• Key: <code>${keyText}</code>`,
    `• Portal: ${env.appBaseUrl}/portal`
  ].join("\n");
}

function buildGmailPaidOrderMessage({ order, keyDelivery }) {
  const orderId = order?.orderCode || order?.id || "(unknown)";
  const appId = order?.appId || "(unknown)";
  const customerId = order?.customerId || "(unknown)";
  const amount = Number(order?.amount || 0).toLocaleString("vi-VN");
  const currency = order?.currency || "VND";

  const keyValue = keyDelivery?.keyValue || "(chua cap key)";
  const keyText = env.gmailIncludeKey ? keyValue : maskKeyValue(keyValue);
  const portalUrl = `${env.appBaseUrl}/portal`;

  const subject = `[WST] Thanh toan thanh cong - ${orderId}`;
  const text = [
    "Thanh toan thanh cong",
    `Order: ${orderId}`,
    `Customer: ${customerId}`,
    `App: ${appId}`,
    `So tien: ${amount} ${currency}`,
    `Key: ${keyText}`,
    `Portal: ${portalUrl}`
  ].join("\n");

  const html = [
    "<h3>Thanh toan thanh cong</h3>",
    `<p><b>Order:</b> <code>${orderId}</code></p>`,
    `<p><b>Customer:</b> <code>${customerId}</code></p>`,
    `<p><b>App:</b> <code>${appId}</code></p>`,
    `<p><b>So tien:</b> <b>${amount} ${currency}</b></p>`,
    `<p><b>Key:</b> <code>${keyText}</code></p>`,
    `<p><b>Portal:</b> <a href="${portalUrl}">${portalUrl}</a></p>`
  ].join("");

  return { subject, text, html };
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getGoogleAccessTokenByRefreshToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      refresh_token: env.googleRefreshToken,
      grant_type: "refresh_token"
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.access_token) {
    const reason = payload?.error_description || payload?.error || `http_${response.status}`;
    throw new Error(`oauth_token_failed:${reason}`);
  }

  return payload.access_token;
}

async function sendGmailMessage({ subject, text, html, to }) {
  if (!isGmailNotifyEnabled()) {
    return { ok: false, skipped: true, reason: "gmail_disabled_or_missing_config" };
  }

  const sender = resolveGmailSender();
  if (!sender) {
    return { ok: false, skipped: true, reason: "missing_from_email" };
  }

  const recipients = Array.isArray(to)
    ? to.map((item) => String(item || "").trim()).filter(Boolean)
    : String(to || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!recipients.length) {
    return { ok: false, skipped: true, reason: "missing_recipient" };
  }

  const accessToken = await getGoogleAccessTokenByRefreshToken();
  const boundary = `wst_${Date.now().toString(16)}`;
  const rawEmail = [
    `From: ${sender}`,
    `To: ${recipients.join(", ")}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    "",
    `--${boundary}--`
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: toBase64Url(rawEmail) })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.id) {
    const reason = payload?.error?.message || `http_${response.status}`;
    return {
      ok: false,
      skipped: false,
      reason
    };
  }

  return {
    ok: true,
    skipped: false,
    messageId: payload.id,
    threadId: payload.threadId || null,
    recipients
  };
}

async function notifyPaidOrderByGmail({ order, keyDelivery }) {
  const orderId = order?.id || null;
  const idempotencyKey = `paid_order_success:${orderId || "unknown"}:${Date.now()}`;

  return notifyPaidOrderByGmailWithPolicy({
    order,
    keyDelivery,
    orderId,
    idempotencyKey
  });
}

async function createEmailNotificationAttempt({
  eventType,
  orderId,
  idempotencyKey,
  provider,
  recipient,
  payload
}) {
  const result = await pool.query(
    `INSERT INTO email_notification_events(event_type, order_id, idempotency_key, provider, recipient, payload)
     VALUES ($1, $2::uuid, $3, $4, $5, $6::jsonb)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [
      eventType,
      orderId || null,
      idempotencyKey,
      provider,
      recipient || "",
      JSON.stringify(payload || {})
    ]
  );

  return {
    duplicated: result.rowCount === 0,
    notificationEventId: result.rows[0]?.id || null
  };
}

async function updateEmailNotificationAttempt({ notificationEventId, status, reason, providerMessageId, payload }) {
  if (!notificationEventId) {
    return;
  }

  await pool.query(
    `UPDATE email_notification_events
     SET status = $2,
         reason = $3,
         provider_message_id = $4,
         payload = COALESCE($5::jsonb, payload),
         updated_at = NOW()
     WHERE id = $1::uuid`,
    [
      notificationEventId,
      status,
      reason || null,
      providerMessageId || null,
      payload ? JSON.stringify(payload) : null
    ]
  );
}

async function hasRecentPaidOrderEmailSent(orderId) {
  if (!orderId) {
    return false;
  }

  const result = await pool.query(
    `SELECT 1
     FROM email_notification_events
     WHERE order_id = $1::uuid
       AND event_type = $2
       AND status = 'sent'
       AND created_at >= NOW() - ($3::int * INTERVAL '1 minute')
     LIMIT 1`,
    [orderId, EMAIL_EVENT_PAID_ORDER_SUCCESS, PAID_ORDER_EMAIL_RESEND_WINDOW_MINUTES]
  );

  return result.rowCount > 0;
}

async function notifyPaidOrderByGmailWithPolicy({ order, keyDelivery, orderId, idempotencyKey }) {
  const recipients = resolveGmailRecipients();

  const attempt = await createEmailNotificationAttempt({
    eventType: EMAIL_EVENT_PAID_ORDER_SUCCESS,
    orderId,
    idempotencyKey,
    provider: "gmail",
    recipient: recipients.join(","),
    payload: {
      orderId,
      orderCode: order?.orderCode || null,
      appId: order?.appId || null,
      customerId: order?.customerId || null
    }
  });

  if (attempt.duplicated) {
    return {
      ok: false,
      skipped: true,
      reason: "duplicate_idempotency_key",
      notificationEventId: null
    };
  }

  if (!isGmailNotifyEnabled()) {
    await updateEmailNotificationAttempt({
      notificationEventId: attempt.notificationEventId,
      status: "skipped",
      reason: "gmail_disabled_or_missing_config"
    });
    return {
      ok: false,
      skipped: true,
      reason: "gmail_disabled_or_missing_config",
      notificationEventId: attempt.notificationEventId
    };
  }

  if (!recipients.length) {
    await updateEmailNotificationAttempt({
      notificationEventId: attempt.notificationEventId,
      status: "skipped",
      reason: "missing_recipient"
    });
    return {
      ok: false,
      skipped: true,
      reason: "missing_recipient",
      notificationEventId: attempt.notificationEventId
    };
  }

  const recentSent = await hasRecentPaidOrderEmailSent(orderId);
  if (recentSent) {
    await updateEmailNotificationAttempt({
      notificationEventId: attempt.notificationEventId,
      status: "skipped",
      reason: `suppressed_within_${PAID_ORDER_EMAIL_RESEND_WINDOW_MINUTES}m_window`
    });
    return {
      ok: false,
      skipped: true,
      reason: `suppressed_within_${PAID_ORDER_EMAIL_RESEND_WINDOW_MINUTES}m_window`,
      notificationEventId: attempt.notificationEventId
    };
  }

  try {
    const message = buildGmailPaidOrderMessage({ order, keyDelivery });
    const sendResult = await sendGmailMessage({ ...message, to: recipients });

    if (sendResult.ok) {
      await updateEmailNotificationAttempt({
        notificationEventId: attempt.notificationEventId,
        status: "sent",
        providerMessageId: sendResult.messageId || null,
        payload: { sendResult }
      });
    } else {
      await updateEmailNotificationAttempt({
        notificationEventId: attempt.notificationEventId,
        status: sendResult.skipped ? "skipped" : "failed",
        reason: sendResult.reason || null,
        payload: { sendResult }
      });
    }

    return {
      ...sendResult,
      notificationEventId: attempt.notificationEventId
    };
  } catch (error) {
    await updateEmailNotificationAttempt({
      notificationEventId: attempt.notificationEventId,
      status: "failed",
      reason: error.message || "send_failed"
    });
    return {
      ok: false,
      skipped: false,
      reason: error.message || "send_failed",
      notificationEventId: attempt.notificationEventId
    };
  }
}

async function notifyPaidOrderToTelegram({ order, keyDelivery }) {
  if (!isTelegramNotifyEnabled()) {
    return { ok: false, skipped: true, reason: "telegram_disabled" };
  }

  try {
    const text = buildTelegramPaidMessage({ order, keyDelivery });
    if (!env.telegramChatId) {
      return { ok: false, skipped: true, reason: "missing_admin_chat_id" };
    }

    return await sendTelegramMessage({ text, chatId: env.telegramChatId });
  } catch (error) {
    return { ok: false, skipped: false, reason: error.message || "send_failed" };
  }
}

function isMockPaymentMode() {
  return getPaymentProviderMode() === "mock";
}

function isStripePaymentMode() {
  return getPaymentProviderMode() === "stripe";
}

function isSepayPaymentMode() {
  return getPaymentProviderMode() === "sepay";
}

function verifyInternalWebhookSignature(signature) {
  if (!signature) {
    const error = new Error("Missing webhook signature");
    error.statusCode = 401;
    throw error;
  }

  if (signature !== env.webhookSignatureSecret) {
    const error = new Error("Invalid webhook signature");
    error.statusCode = 401;
    throw error;
  }
}

function validatePaidWebhookPayload(payload) {
  const { eventId, orderId, orderCode, provider, providerTransactionId, status } = payload;
  if (!eventId || (!orderId && !orderCode) || !provider || !providerTransactionId || status !== "paid") {
    const error = new Error("Invalid webhook payload");
    error.statusCode = 400;
    throw error;
  }
}

async function processPaidWebhook(payload) {
  validatePaidWebhookPayload(payload);

  let resolvedOrderId = payload.orderId;
  if (!resolvedOrderId && payload.orderCode) {
    const foundOrder = await getOrderByCode(payload.orderCode);
    if (!foundOrder) {
      const error = new Error("Order khong ton tai");
      error.statusCode = 404;
      throw error;
    }
    resolvedOrderId = foundOrder.id;
  }

  const duplication = await recordWebhookEvent({
    eventId: payload.eventId,
    orderId: resolvedOrderId,
    provider: payload.provider,
    providerTransactionId: payload.providerTransactionId,
    status: payload.status,
    payload: {
      ...payload,
      orderId: resolvedOrderId
    }
  });

  if (duplication.duplicated) {
    return { ok: true, idempotent: true };
  }

  const result = await markOrderPaid({
    orderId: resolvedOrderId,
    provider: payload.provider,
    providerTransactionId: payload.providerTransactionId,
    payload: {
      ...payload,
      orderId: resolvedOrderId
    }
  });

  const gmailNotification = await notifyPaidOrderByGmailWithPolicy({
    order: result.order,
    keyDelivery: result.keyDelivery || null,
    orderId: resolvedOrderId,
    idempotencyKey: `paid_order_success:${payload.eventId}:${resolvedOrderId}`
  });

  return {
    ok: true,
    idempotent: result.idempotent,
    order: result.order,
    keyDelivery: result.keyDelivery || null,
    appLicense: result.appLicense || null,
    gmailNotification
  };
}

async function confirmMockPayment(orderId) {
  if (!isMockPaymentMode()) {
    const error = new Error("Mock payment endpoint is disabled");
    error.statusCode = 404;
    throw error;
  }

  const suffix = Date.now();
  return processPaidWebhook({
    eventId: `evt_mock_${orderId}_${suffix}`,
    orderId,
    provider: "mockpay",
    providerTransactionId: `tx_mock_${orderId}_${suffix}`,
    status: "paid",
    source: "mock_checkout_ui"
  });
}

function getStripeClient() {
  if (!env.stripeSecretKey) {
    const error = new Error("Missing STRIPE_SECRET_KEY");
    error.statusCode = 500;
    throw error;
  }

  // Lazy load so mock mode does not require Stripe at runtime.
  const Stripe = require("stripe");
  return new Stripe(env.stripeSecretKey);
}

function verifySepayWebhookSignature(payload, signature) {
  if (!isSepayPaymentMode()) {
    const error = new Error("Sepay webhook endpoint is disabled");
    error.statusCode = 404;
    throw error;
  }

  const sepay = getSepayConfig();

  if (!sepay.webhookSecret) {
    if (matchesConfiguredSepayAccount(payload)) {
      return;
    }

    const error = new Error("Missing SEPAY_WEBHOOK_SECRET");
    error.statusCode = 500;
    throw error;
  }

  if (!signature) {
    if (matchesConfiguredSepayAccount(payload)) {
      return;
    }

    const error = new Error("Missing Sepay signature");
    error.statusCode = 401;
    throw error;
  }

  if (signature !== sepay.webhookSecret) {
    const error = new Error("Invalid Sepay signature");
    error.statusCode = 401;
    throw error;
  }
}

function normalizeSepayWebhookSignature(rawSignature) {
  const value = String(rawSignature || "").trim();
  if (!value) {
    return "";
  }

  return value.replace(/^(?:apikey|bearer)\s+/i, "").trim();
}

function normalizeDigits(value) {
  return String(value || "").replace(/\D+/g, "").trim();
}

function matchesConfiguredSepayAccount(payload) {
  const configuredAccount = normalizeDigits(getSepayConfig().bankAccountNumber);
  if (!configuredAccount) {
    return false;
  }

  const payloadAccounts = [
    payload?.accountNumber,
    payload?.account,
    payload?.bankAccount,
    payload?.bank_account,
    payload?.receiverAccount,
    payload?.receiver_account,
    payload?.toAccountNumber,
    payload?.to_account_number,
    payload?.subAccount,
    payload?.sub_account
  ].map(normalizeDigits);

  return payloadAccounts.includes(configuredAccount);
}

function extractOrderIdFromText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const uuidMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  if (!uuidMatch) {
    return null;
  }

  return uuidMatch[0];
}

function extractOrderCodeFromText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const normalized = text.toUpperCase();
  const dashedCodeMatch = normalized.match(/\b(?:WST|ODR)-[A-Z0-9-]{6,}\b/);
  if (dashedCodeMatch) {
    return dashedCodeMatch[0];
  }

  // Backward compatibility: accept compact format without dash, e.g. WSTMO87L7TW03CC.
  const compactCodeMatch = normalized.match(/\b(?:WST|ODR)[A-Z0-9]{8,}\b/);
  if (!compactCodeMatch) {
    return null;
  }

  return compactCodeMatch[0];
}

function parseSepayWebhook(payload, signature) {
  verifySepayWebhookSignature(payload, signature);

  const rawStatus = String(payload?.status || payload?.transactionStatus || "").toLowerCase();
  const paidStatuses = new Set(["paid", "success", "completed"]);

  const amountIn = Number(
    payload?.amountIn ?? payload?.amount_in ?? payload?.transferAmount ?? payload?.amount ?? 0
  );

  const paidByAmount = Number.isFinite(amountIn) && amountIn > 0;
  const isPaid = paidStatuses.has(rawStatus) || paidByAmount;
  if (!isPaid) {
    return null;
  }

  const orderId =
    payload?.orderId ||
    payload?.order_id ||
    payload?.metadata?.orderId ||
    extractOrderIdFromText(payload?.content) ||
    extractOrderIdFromText(payload?.description) ||
    extractOrderIdFromText(payload?.transferContent) ||
    extractOrderIdFromText(payload?.referenceCode);

  const orderCode =
    payload?.orderCode ||
    payload?.order_code ||
    payload?.metadata?.orderCode ||
    extractOrderCodeFromText(payload?.content) ||
    extractOrderCodeFromText(payload?.description) ||
    extractOrderCodeFromText(payload?.transferContent) ||
    extractOrderCodeFromText(payload?.referenceCode);

  if (!orderId && !orderCode) {
    const error = new Error("Sepay event missing order reference");
    error.statusCode = 400;
    throw error;
  }

  const providerTransactionId =
    payload?.transactionId ||
    payload?.transaction_id ||
    payload?.gatewayTransactionId ||
    payload?.referenceCode ||
    payload?.id ||
    `sepay_tx_${Date.now()}`;

  const orderRef = orderId || orderCode;
  const eventId = payload?.eventId || payload?.event_id || payload?.id || `${providerTransactionId}_${orderRef}`;

  return {
    eventId,
    orderId,
    orderCode,
    provider: "sepay",
    providerTransactionId,
    status: "paid",
    source: "sepay_webhook",
    payload
  };
}

function buildSepayCheckout(order) {
  const sepay = getSepayConfig();
  const transferContent = `PAY ${order.orderCode || order.id}`;
  const fallbackQrText = `bank=${sepay.bankCode}|account=${sepay.bankAccountNumber}|amount=${order.amount}|memo=${transferContent}`;

  let qrUrl = "";
  if (sepay.qrTemplateUrl) {
    qrUrl = sepay.qrTemplateUrl
      .replace("{bank}", encodeURIComponent(sepay.bankCode))
      .replace("{account}", encodeURIComponent(sepay.bankAccountNumber))
      .replace("{amount}", encodeURIComponent(String(order.amount)))
      .replace("{memo}", encodeURIComponent(transferContent));
  }

  return {
    provider: "sepay",
    bankCode: sepay.bankCode,
    accountNumber: sepay.bankAccountNumber,
    accountName: sepay.accountName,
    amount: order.amount,
    currency: order.currency,
    transferContent,
    qrUrl,
    fallbackQrText
  };
}

function parseStripeWebhook(rawBody, signature) {
  if (!isStripePaymentMode()) {
    const error = new Error("Stripe webhook endpoint is disabled");
    error.statusCode = 404;
    throw error;
  }

  if (!env.stripeWebhookSecret) {
    const error = new Error("Missing STRIPE_WEBHOOK_SECRET");
    error.statusCode = 500;
    throw error;
  }

  if (!signature) {
    const error = new Error("Missing Stripe signature");
    error.statusCode = 401;
    throw error;
  }

  const stripe = getStripeClient();
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

  if (event.type !== "checkout.session.completed" && event.type !== "payment_intent.succeeded") {
    return null;
  }

  const object = event.data.object;
  const metadata = object.metadata || {};
  const orderId = metadata.orderId || metadata.order_id;
  if (!orderId) {
    const error = new Error("Stripe event missing orderId in metadata");
    error.statusCode = 400;
    throw error;
  }

  let providerTransactionId = object.id;
  if (event.type === "checkout.session.completed") {
    providerTransactionId = object.payment_intent || object.id;
  }

  return {
    eventId: event.id,
    orderId,
    provider: "stripe",
    providerTransactionId,
    status: "paid",
    source: "stripe_webhook",
    eventType: event.type,
    rawObject: object
  };
}

module.exports = {
  verifyInternalWebhookSignature,
  processPaidWebhook,
  confirmMockPayment,
  parseStripeWebhook,
  parseSepayWebhook,
  verifySepayWebhookSignature,
  normalizeSepayWebhookSignature,
  buildSepayCheckout,
  sendGmailMessage,
  isGmailNotifyEnabled,
  sendTelegramMessage,
  isTelegramNotifyEnabled,
  isMockPaymentMode,
  isStripePaymentMode,
  isSepayPaymentMode
};
