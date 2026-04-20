const { env } = require("../config/env");
const { recordWebhookEvent, markOrderPaid } = require("./store");

function isMockPaymentMode() {
  return env.paymentProviderMode === "mock";
}

function isStripePaymentMode() {
  return env.paymentProviderMode === "stripe";
}

function isSepayPaymentMode() {
  return env.paymentProviderMode === "sepay";
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
  const { eventId, orderId, provider, providerTransactionId, status } = payload;
  if (!eventId || !orderId || !provider || !providerTransactionId || status !== "paid") {
    const error = new Error("Invalid webhook payload");
    error.statusCode = 400;
    throw error;
  }
}

async function processPaidWebhook(payload) {
  validatePaidWebhookPayload(payload);

  const duplication = await recordWebhookEvent({
    eventId: payload.eventId,
    orderId: payload.orderId,
    provider: payload.provider,
    providerTransactionId: payload.providerTransactionId,
    status: payload.status,
    payload
  });

  if (duplication.duplicated) {
    return { ok: true, idempotent: true };
  }

  const result = await markOrderPaid({
    orderId: payload.orderId,
    provider: payload.provider,
    providerTransactionId: payload.providerTransactionId,
    payload
  });

  return {
    ok: true,
    idempotent: result.idempotent,
    order: result.order,
    keyDelivery: result.keyDelivery || null
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

  if (!env.sepayWebhookSecret) {
    const error = new Error("Missing SEPAY_WEBHOOK_SECRET");
    error.statusCode = 500;
    throw error;
  }

  if (!signature) {
    const error = new Error("Missing Sepay signature");
    error.statusCode = 401;
    throw error;
  }

  if (signature !== env.sepayWebhookSecret) {
    const error = new Error("Invalid Sepay signature");
    error.statusCode = 401;
    throw error;
  }
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

  if (!orderId) {
    const error = new Error("Sepay event missing orderId");
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

  const eventId = payload?.eventId || payload?.event_id || payload?.id || `${providerTransactionId}_${orderId}`;

  return {
    eventId,
    orderId,
    provider: "sepay",
    providerTransactionId,
    status: "paid",
    source: "sepay_webhook",
    payload
  };
}

function buildSepayCheckout(order) {
  const transferContent = `PAY ${order.id}`;
  const fallbackQrText = `bank=${env.sepayBankCode}|account=${env.sepayBankAccountNumber}|amount=${order.amount}|memo=${transferContent}`;

  let qrUrl = "";
  if (env.sepayQrTemplateUrl) {
    qrUrl = env.sepayQrTemplateUrl
      .replace("{bank}", encodeURIComponent(env.sepayBankCode))
      .replace("{account}", encodeURIComponent(env.sepayBankAccountNumber))
      .replace("{amount}", encodeURIComponent(String(order.amount)))
      .replace("{memo}", encodeURIComponent(transferContent));
  }

  return {
    provider: "sepay",
    bankCode: env.sepayBankCode,
    accountNumber: env.sepayBankAccountNumber,
    accountName: env.sepayAccountName,
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
  buildSepayCheckout,
  isMockPaymentMode,
  isStripePaymentMode,
  isSepayPaymentMode
};
