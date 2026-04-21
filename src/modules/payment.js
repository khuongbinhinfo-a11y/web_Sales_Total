const { env } = require("../config/env");
const { recordWebhookEvent, markOrderPaid, getOrderByCode, getCustomerTelegramByCustomerId } = require("./store");
const { getSepayRuntimeSettings, readRuntimeSettings } = require("../config/runtimeSettings");

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

async function notifyPaidOrderToTelegram({ order, keyDelivery }) {
  if (!isTelegramNotifyEnabled()) {
    return { ok: false, skipped: true, reason: "telegram_disabled" };
  }

  try {
    const text = buildTelegramPaidMessage({ order, keyDelivery });
    const customerTelegram = await getCustomerTelegramByCustomerId(order?.customerId);
    const customerChatId = customerTelegram?.chatId ? String(customerTelegram.chatId) : "";

    if (customerChatId) {
      return await sendTelegramMessage({ text, chatId: customerChatId });
    }

    if (env.telegramChatId) {
      return await sendTelegramMessage({ text, chatId: env.telegramChatId });
    }

    return { ok: false, skipped: true, reason: "missing_customer_and_admin_chat_id" };
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

  const telegramNotification = await notifyPaidOrderToTelegram({
    order: result.order,
    keyDelivery: result.keyDelivery || null
  });

  return {
    ok: true,
    idempotent: result.idempotent,
    order: result.order,
    keyDelivery: result.keyDelivery || null,
    telegramNotification
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

function verifySepayWebhookSignature(signature) {
  if (!isSepayPaymentMode()) {
    const error = new Error("Sepay webhook endpoint is disabled");
    error.statusCode = 404;
    throw error;
  }

  const sepay = getSepayConfig();

  if (!sepay.webhookSecret) {
    const error = new Error("Missing SEPAY_WEBHOOK_SECRET");
    error.statusCode = 500;
    throw error;
  }

  if (!signature) {
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

  const codeMatch = text.toUpperCase().match(/\b(?:WST|ODR)-[A-Z0-9-]{6,}\b/);
  if (!codeMatch) {
    return null;
  }

  return codeMatch[0];
}

function parseSepayWebhook(payload, signature) {
  verifySepayWebhookSignature(signature);

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
  sendTelegramMessage,
  isTelegramNotifyEnabled,
  isMockPaymentMode,
  isStripePaymentMode,
  isSepayPaymentMode
};
