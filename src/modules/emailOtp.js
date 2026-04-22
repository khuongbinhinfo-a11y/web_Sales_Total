const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { pool } = require("../db/pool");
const { sendGmailMessage, isGmailNotifyEnabled } = require("./payment");

const OTP_TTL_MINUTES = 10;
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;

let cachedTransporter = null;

function hasSmtpTransportConfig() {
  return Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPass && env.smtpFrom);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp({ email, purpose, code }) {
  const payload = `${normalizeEmail(email)}|${String(purpose || "").trim()}|${String(code || "").trim()}`;
  return crypto.createHmac("sha256", env.sessionSigningSecret).update(payload).digest("hex");
}

function generateOtpCode() {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function isEmailOtpConfigured() {
  return Boolean(hasSmtpTransportConfig() || isGmailNotifyEnabled());
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Only create SMTP transporter when full SMTP config is available.
  // If only Gmail OAuth is configured, return null so sendOtpEmail uses Gmail API.
  if (!hasSmtpTransportConfig()) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: Number(env.smtpPort) === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  return cachedTransporter;
}

async function ensureEmailOtpSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_email_otps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      max_attempts INT NOT NULL DEFAULT 5,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_email_otps_lookup
      ON customer_email_otps(email, purpose, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_email_otps_expiry
      ON customer_email_otps(expires_at)
  `);
}

function subjectByPurpose(purpose) {
  if (String(purpose || "").startsWith("admin_login:")) {
    return "Ma xac minh dang nhap quan tri";
  }
  return purpose === "reset_password"
    ? "Ma xac minh dat lai mat khau"
    : "Ma xac minh dang ky tai khoan";
}

function bodyByPurpose({ purpose, code }) {
  if (String(purpose || "").startsWith("admin_login:")) {
    return `Ma OTP dang nhap quan tri cua ban la: ${code}. Ma co hieu luc trong ${OTP_TTL_MINUTES} phut.`;
  }
  if (purpose === "reset_password") {
    return `Ma dat lai mat khau cua ban la: ${code}. Ma co hieu luc trong ${OTP_TTL_MINUTES} phut.`;
  }
  return `Ma xac minh dang ky cua ban la: ${code}. Ma co hieu luc trong ${OTP_TTL_MINUTES} phut.`;
}

async function sendOtpEmail({ to, subject, text }) {
  const html = `<p>${text}</p>`;
  if (isGmailNotifyEnabled()) {
    const result = await sendGmailMessage({
      subject,
      text,
      html,
      to: [to]
    });

    if (result.ok) {
      return;
    }
  }

  const transporter = getTransporter();
  if (transporter) {
    await transporter.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text
    });
    return;
  }

  const err = new Error("OTP email delivery is not available");
  err.statusCode = 502;
  throw err;
}

async function issueAndSendOtp({ email, purpose }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPurpose = String(purpose || "").trim();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const err = new Error("Email khong hop le");
    err.statusCode = 400;
    throw err;
  }

  if (!isEmailOtpConfigured()) {
    const err = new Error("He thong email OTP chua duoc cau hinh");
    err.statusCode = 503;
    throw err;
  }

  const code = generateOtpCode();
  const codeHash = hashOtp({ email: normalizedEmail, purpose: normalizedPurpose, code });

  await pool.query(
    `UPDATE customer_email_otps
     SET consumed_at = NOW()
     WHERE email = $1
       AND purpose = $2
       AND consumed_at IS NULL`,
    [normalizedEmail, normalizedPurpose]
  );

  await pool.query(
    `INSERT INTO customer_email_otps(email, purpose, code_hash, attempts, max_attempts, expires_at)
     VALUES ($1, $2, $3, 0, $4, NOW() + ($5::text || ' minutes')::interval)`,
    [normalizedEmail, normalizedPurpose, codeHash, MAX_ATTEMPTS, OTP_TTL_MINUTES]
  );

  const subject = subjectByPurpose(normalizedPurpose);
  const text = bodyByPurpose({ purpose: normalizedPurpose, code });
  await sendOtpEmail({
    to: normalizedEmail,
    subject,
    text
  });

  return { ok: true, expiresInMinutes: OTP_TTL_MINUTES };
}

async function verifyOtpCode({ email, purpose, code }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPurpose = String(purpose || "").trim();
  const normalizedCode = String(code || "").trim();

  if (!normalizedCode) {
    return { ok: false, message: "Thieu ma xac minh" };
  }

  const result = await pool.query(
    `SELECT id, code_hash, attempts, max_attempts, expires_at
     FROM customer_email_otps
     WHERE email = $1
       AND purpose = $2
       AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, normalizedPurpose]
  );

  if (result.rowCount === 0) {
    return { ok: false, message: "Ma xac minh khong ton tai hoac da het han" };
  }

  const row = result.rows[0];
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, message: "Ma xac minh da het han" };
  }

  if (Number(row.attempts) >= Number(row.max_attempts)) {
    return { ok: false, message: "Ban da nhap sai qua nhieu lan. Vui long gui lai ma moi" };
  }

  const expected = hashOtp({ email: normalizedEmail, purpose: normalizedPurpose, code: normalizedCode });
  if (expected !== row.code_hash) {
    await pool.query(
      `UPDATE customer_email_otps
       SET attempts = attempts + 1
       WHERE id = $1`,
      [row.id]
    );
    return { ok: false, message: "Ma xac minh khong dung" };
  }

  await pool.query(
    `UPDATE customer_email_otps
     SET consumed_at = NOW()
     WHERE id = $1`,
    [row.id]
  );

  return { ok: true };
}

module.exports = {
  ensureEmailOtpSchema,
  issueAndSendOtp,
  verifyOtpCode,
  isEmailOtpConfigured
};
