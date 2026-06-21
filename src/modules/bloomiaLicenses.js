const crypto = require("crypto");

const BLOOMIA_APP_ID = "app-bloomia-pos";
const BLOOMIA_LICENSE_KEY_PREFIX = "BLM";
const BLOOMIA_LICENSE_KEY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const BLOOMIA_LICENSE_KEY_BODY_LENGTH = 32;
const BLOOMIA_OFFLINE_GRACE_DAYS = 7;

function normalizeBloomiaAppId(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeBloomiaLicenseKey(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeBloomiaMachineId(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeBloomiaDeviceName(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function generateRandomBloomiaChars(length) {
  const chars = [];
  const alphabetLength = BLOOMIA_LICENSE_KEY_ALPHABET.length;
  const limit = 256 - (256 % alphabetLength);

  while (chars.length < length) {
    const bytes = crypto.randomBytes(length * 2);
    for (const byte of bytes) {
      if (chars.length >= length) {
        break;
      }
      if (byte >= limit) {
        continue;
      }
      chars.push(BLOOMIA_LICENSE_KEY_ALPHABET[byte % alphabetLength]);
    }
  }

  return chars.join("");
}

function generateBloomiaLicenseKey() {
  const chunks = [];
  const body = generateRandomBloomiaChars(BLOOMIA_LICENSE_KEY_BODY_LENGTH);
  for (let index = 0; index < body.length; index += 4) {
    chunks.push(body.slice(index, index + 4));
  }
  return `${BLOOMIA_LICENSE_KEY_PREFIX}-${chunks.join("-")}`;
}

function createBloomiaActivationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashBloomiaActivationToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function parseBloomiaDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeBloomiaOfflineUntil({ expiresAt = null, now = new Date(), graceDays = BLOOMIA_OFFLINE_GRACE_DAYS } = {}) {
  const safeNow = now instanceof Date ? now : new Date(now);
  const graceMs = Math.max(1, Number(graceDays) || BLOOMIA_OFFLINE_GRACE_DAYS) * 24 * 60 * 60 * 1000;
  const graceCutoff = new Date(safeNow.getTime() + graceMs);
  const expiryDate = parseBloomiaDate(expiresAt);

  if (!expiryDate) {
    return graceCutoff;
  }

  return new Date(Math.min(graceCutoff.getTime(), expiryDate.getTime()));
}

function buildBloomiaOfflineLeasePayload({
  appId = BLOOMIA_APP_ID,
  licenseId,
  machineId,
  status,
  expiresAt = null,
  offlineUntil = null,
  issuedAt = new Date()
} = {}) {
  return {
    appId: normalizeBloomiaAppId(appId) || BLOOMIA_APP_ID,
    licenseId: String(licenseId || "").trim(),
    machineId: String(machineId || "").trim(),
    status: String(status || "").trim().toLowerCase() || "active",
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    offlineUntil: offlineUntil ? new Date(offlineUntil).toISOString() : null,
    issuedAt: issuedAt instanceof Date ? issuedAt.toISOString() : new Date(issuedAt).toISOString()
  };
}

function loadEd25519PrivateKey(privateKeyRaw) {
  const raw = String(privateKeyRaw || "").trim();
  if (!raw) {
    throw new Error("BLOOMIA_LICENSE_PRIVATE_KEY is not configured");
  }

  if (raw.startsWith("-----BEGIN")) {
    return crypto.createPrivateKey(raw);
  }

  const buffer = Buffer.from(raw, "base64");
  if (buffer.length === 0) {
    throw new Error("BLOOMIA_LICENSE_PRIVATE_KEY is invalid");
  }

  return crypto.createPrivateKey({ key: buffer, format: "der", type: "pkcs8" });
}

function deriveEd25519PublicKeyBase64(privateKeyRaw) {
  const privateKey = loadEd25519PrivateKey(privateKeyRaw);
  const publicKey = crypto.createPublicKey(privateKey);
  const exported = publicKey.export({ format: "der", type: "spki" });
  return Buffer.from(exported).subarray(-32).toString("base64");
}

function signBloomiaOfflineLease(payload, privateKeyRaw) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const privateKey = loadEd25519PrivateKey(privateKeyRaw);
  const signature = crypto.sign(null, Buffer.from(encodedPayload, "utf8"), privateKey).toString("base64url");
  return `${encodedPayload}.${signature}`;
}

module.exports = {
  BLOOMIA_APP_ID,
  BLOOMIA_LICENSE_KEY_PREFIX,
  BLOOMIA_LICENSE_KEY_ALPHABET,
  BLOOMIA_OFFLINE_GRACE_DAYS,
  normalizeBloomiaAppId,
  normalizeBloomiaLicenseKey,
  normalizeBloomiaMachineId,
  normalizeBloomiaDeviceName,
  generateBloomiaLicenseKey,
  createBloomiaActivationToken,
  hashBloomiaActivationToken,
  computeBloomiaOfflineUntil,
  buildBloomiaOfflineLeasePayload,
  loadEd25519PrivateKey,
  deriveEd25519PublicKeyBase64,
  signBloomiaOfflineLease
};
