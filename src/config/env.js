const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Prefer workspace .env values over stale shell-level variables when the dev server restarts.
dotenv.config({ override: true });

function isIpAddress(hostname) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function resolveSessionCookieDomain(appBaseUrl) {
  const explicit = (process.env.SESSION_COOKIE_DOMAIN || "").trim();
  if (explicit) {
    return explicit;
  }

  try {
    const parsed = new URL(process.env.APP_PUBLIC_BASE_URL || appBaseUrl || "");
    let hostname = String(parsed.hostname || "").trim().toLowerCase();
    if (!hostname || hostname === "localhost" || isIpAddress(hostname)) {
      return "";
    }
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname.startsWith(".") ? hostname : `.${hostname}`;
  } catch {
    return "";
  }
}

function resolvePublicAppBaseUrl(appBaseUrl) {
  const explicit = String(process.env.APP_PUBLIC_BASE_URL || "").trim();
  const candidate = explicit || String(appBaseUrl || "").trim();
  const primaryProductionUrl = "https://ungdungthongminh.shop";

  if (!candidate) {
    return primaryProductionUrl;
  }

  try {
    const parsed = new URL(candidate);
    const hostname = String(parsed.hostname || "").trim().toLowerCase();
    const isPrivateHost = !hostname || hostname === "localhost" || isIpAddress(hostname);
    const isVercelHost = hostname.endsWith(".vercel.app");

    if (explicit) {
      return `${parsed.protocol}//${parsed.host}`;
    }

    if (process.env.NODE_ENV === "production" && (isPrivateHost || isVercelHost)) {
      return primaryProductionUrl;
    }

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return explicit || candidate || primaryProductionUrl;
  }
}

function loadGoogleOAuthClientFromFile() {
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
      const clientSecret =
        String(json?.web?.client_secret || "").trim() ||
        String(json?.installed?.client_secret || "").trim();

      if (clientId || clientSecret) {
        return { clientId, clientSecret };
      }
    } catch {
      // skip invalid file
    }
  }

  return { clientId: "", clientSecret: "" };
}

const oauthClient = loadGoogleOAuthClientFromFile();
const resolvedGoogleClientId = String(process.env.GOOGLE_CLIENT_ID || "").trim() || oauthClient.clientId;
const resolvedGoogleClientSecret = String(process.env.GOOGLE_CLIENT_SECRET || "").trim() || oauthClient.clientSecret;
const hasGoogleRefreshTokenAlias = !String(process.env.GOOGLE_REFRESH_TOKEN || "").trim() && Boolean(String(process.env.GOOGLE_REFRESH_TOKE || "").trim());
const resolvedGoogleRefreshToken = String(process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKE || "").trim();

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value).trim().toLowerCase() === "true";
}

function toPositiveInt(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
}

function parseCsvList(value, fallback = []) {
  const raw = String(value || "").trim();
  if (!raw) {
    return fallback;
  }
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3900,
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3900",
  publicAppBaseUrl: resolvePublicAppBaseUrl(process.env.APP_BASE_URL || "http://localhost:3900"),
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
  gmailNotifyEnabled: String(process.env.GMAIL_NOTIFY_ENABLED || "false").toLowerCase() === "true",
  gmailNotifyFrom: String(process.env.GMAIL_NOTIFY_FROM || process.env.SMTP_FROM || "").trim(),
  gmailNotifyTo: String(process.env.GMAIL_NOTIFY_TO || "").trim(),
  gmailIncludeKey: String(process.env.GMAIL_INCLUDE_KEY || "false").toLowerCase() === "true",
  googleClientId: resolvedGoogleClientId,
  googleClientSecret: resolvedGoogleClientSecret,
  googleRefreshToken: resolvedGoogleRefreshToken,
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 0,
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  sessionSigningSecret: process.env.SESSION_SIGNING_SECRET || "dev-session-secret",
  sessionCookieDomain: resolveSessionCookieDomain(process.env.APP_BASE_URL || "http://localhost:3900"),
  customerSessionDays: Math.max(1, Number(process.env.CUSTOMER_SESSION_DAYS) || 30),
  portalAccessKey: process.env.PORTAL_ACCESS_KEY || "portal-demo",
  aiAppSharedKey: String(
    process.env.AI_APP_SHARED_KEY || process.env.WEB_TOTAL_AI_APP_KEY || ""
  ).trim(),
  aiAppOfflineGraceDays: toPositiveInt(process.env.AI_APP_OFFLINE_GRACE_DAYS, 7),
  adminAccessKey: String(process.env.ADMIN_ACCESS_KEY || "").trim(),
  adminOwnerKeyLoginEnabled: toBool(process.env.ADMIN_OWNER_KEY_LOGIN_ENABLED, false),
  adminLoginWindowMs: toPositiveInt(process.env.ADMIN_LOGIN_WINDOW_MS, 15 * 60 * 1000),
  adminLoginMaxAttempts: toPositiveInt(process.env.ADMIN_LOGIN_MAX_ATTEMPTS, 5),
  adminLoginLockoutMs: toPositiveInt(process.env.ADMIN_LOGIN_LOCKOUT_MS, 15 * 60 * 1000),
  adminOtpTtlMs: toPositiveInt(process.env.ADMIN_OTP_TTL_MS, 10 * 60 * 1000),
  adminOtpRequiredRoles: parseCsvList(process.env.ADMIN_OTP_REQUIRED_ROLES, ["owner", "manager"]),
  githubToken: process.env.GITHUB_TOKEN || "",
  githubRepoOwner: process.env.GITHUB_REPO_OWNER || "khuongbinhinfo-a11y",
  githubRepoName: process.env.GITHUB_REPO_NAME || "web_Sales_Total",
  githubRepoBranch: process.env.GITHUB_REPO_BRANCH || "main"
};

function getStartupConfigIssues() {
  const issues = [];

  if (env.nodeEnv === "production") {
    if (!env.sessionSigningSecret || env.sessionSigningSecret === "dev-session-secret") {
      issues.push("SESSION_SIGNING_SECRET must be set to a strong secret in production.");
    }

    if (env.adminOwnerKeyLoginEnabled) {
      if (!env.adminAccessKey) {
        issues.push("ADMIN_ACCESS_KEY is required when ADMIN_OWNER_KEY_LOGIN_ENABLED=true.");
      } else if (env.adminAccessKey.length < 16) {
        issues.push("ADMIN_ACCESS_KEY must be at least 16 characters in production.");
      } else if (env.adminAccessKey.toLowerCase() === "admin-demo") {
        issues.push("ADMIN_ACCESS_KEY cannot use demo defaults in production.");
      }
    }
  }

  return issues;
}

const startupConfigIssues = getStartupConfigIssues();

if (!env.databaseUrl) {
  console.warn("[env] DATABASE_URL is missing. Database-backed routes will return errors until it is configured.");
}

if (hasGoogleRefreshTokenAlias) {
  console.warn("[env] GOOGLE_REFRESH_TOKE is deprecated. Rename it to GOOGLE_REFRESH_TOKEN.");
}

for (const issue of startupConfigIssues) {
  console.error(`[env] ${issue}`);
}

module.exports = {
  env,
  getStartupConfigIssues,
  startupConfigIssues
};
