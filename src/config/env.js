const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables once at process startup.
dotenv.config();

function isIpAddress(hostname) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function resolveSessionCookieDomain(appBaseUrl) {
  const explicit = (process.env.SESSION_COOKIE_DOMAIN || "").trim();
  if (explicit) {
    return explicit;
  }

  try {
    const parsed = new URL(appBaseUrl || "");
    const hostname = String(parsed.hostname || "").trim().toLowerCase();
    if (!hostname || hostname === "localhost" || isIpAddress(hostname)) {
      return "";
    }
    return hostname.startsWith(".") ? hostname : `.${hostname}`;
  } catch {
    return "";
  }
}

function loadGoogleClientIdFromOAuthFile() {
  const explicitFile = String(process.env.GOOGLE_OAUTH_CLIENT_FILE || "").trim();
  const rootDir = process.cwd();
  const candidates = [];

  if (explicitFile) {
    candidates.push(path.isAbsolute(explicitFile) ? explicitFile : path.join(rootDir, explicitFile));
  }

  try {
    const autoDetected = fs
      .readdirSync(rootDir)
      .filter((name) => /^client_secret_.*\.json$/i.test(name))
      .map((name) => path.join(rootDir, name));
    candidates.push(...autoDetected);
  } catch {
    // ignore
  }

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) {
        continue;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      const json = JSON.parse(raw);
      const clientId =
        String(json?.web?.client_id || "").trim() ||
        String(json?.installed?.client_id || "").trim();
      if (clientId) {
        return clientId;
      }
    } catch {
      // skip invalid file
    }
  }

  return "";
}

const resolvedGoogleClientId = String(process.env.GOOGLE_CLIENT_ID || "").trim() || loadGoogleClientIdFromOAuthFile();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3900,
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3900",
  databaseUrl: process.env.DATABASE_URL,
  webhookSignatureSecret: process.env.WEBHOOK_SIGNATURE_SECRET || "demo-signature",
  paymentProviderMode: process.env.PAYMENT_PROVIDER_MODE || "mock",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  sepayWebhookSecret: process.env.SEPAY_WEBHOOK_SECRET || "",
  sepayBankCode: process.env.SEPAY_BANK_CODE || "970422",
  sepayBankAccountNumber: process.env.SEPAY_BANK_ACCOUNT_NUMBER || "",
  sepayAccountName: process.env.SEPAY_ACCOUNT_NAME || "",
  sepayQrTemplateUrl: process.env.SEPAY_QR_TEMPLATE_URL || "",
  telegramNotifyEnabled: String(process.env.TELEGRAM_NOTIFY_ENABLED || "false").toLowerCase() === "true",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  telegramIncludeKey: String(process.env.TELEGRAM_INCLUDE_KEY || "false").toLowerCase() === "true",
  googleClientId: resolvedGoogleClientId,
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 0,
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  sessionSigningSecret: process.env.SESSION_SIGNING_SECRET || "dev-session-secret",
  sessionCookieDomain: resolveSessionCookieDomain(process.env.APP_BASE_URL || "http://localhost:3900"),
  customerSessionDays: Math.max(1, Number(process.env.CUSTOMER_SESSION_DAYS) || 30),
  portalAccessKey: process.env.PORTAL_ACCESS_KEY || "portal-demo",
  adminAccessKey: process.env.ADMIN_ACCESS_KEY || "admin-demo"
};

if (!env.databaseUrl) {
  throw new Error("Missing DATABASE_URL. Copy .env.example to .env and set DATABASE_URL.");
}

module.exports = { env };
