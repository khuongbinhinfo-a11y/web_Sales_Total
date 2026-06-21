const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const {
  BLOOMIA_APP_ID,
  buildBloomiaOfflineLeasePayload,
  computeBloomiaOfflineUntil,
  createBloomiaActivationToken,
  generateBloomiaLicenseKey,
  hashBloomiaActivationToken,
  signBloomiaOfflineLease
} = require("./bloomiaLicenses");

test("generateBloomiaLicenseKey returns the Bloomia prefix and grouped body", () => {
  const key = generateBloomiaLicenseKey();
  assert.match(key, /^BLM-(?:[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-){7}[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
});

test("activation token hash is stable and looks like sha256", () => {
  const token = createBloomiaActivationToken();
  const hash = hashBloomiaActivationToken(token);
  assert.equal(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash, hashBloomiaActivationToken(token));
});

test("offline lease signs payload with Ed25519", () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
  const payload = buildBloomiaOfflineLeasePayload({
    appId: BLOOMIA_APP_ID,
    licenseId: "license-123",
    machineId: "machine-123",
    status: "active",
    expiresAt: "2027-06-21T00:00:00.000Z",
    offlineUntil: "2026-06-28T00:00:00.000Z",
    issuedAt: "2026-06-21T00:00:00.000Z"
  });

  const lease = signBloomiaOfflineLease(payload, privateKey.export({ format: "pem", type: "pkcs8" }));
  const [encodedPayload, signature] = lease.split(".");
  assert.ok(encodedPayload);
  assert.ok(signature);

  const verified = crypto.verify(
    null,
    Buffer.from(encodedPayload, "utf8"),
    publicKey,
    Buffer.from(signature, "base64url")
  );
  assert.equal(verified, true);

  const decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  assert.equal(decoded.appId, BLOOMIA_APP_ID);
  assert.equal(decoded.machineId, "machine-123");
});

test("offline grace is capped by license expiry", () => {
  const offlineUntil = computeBloomiaOfflineUntil({
    now: new Date("2026-06-21T00:00:00.000Z"),
    expiresAt: "2026-06-23T00:00:00.000Z",
    graceDays: 7
  });

  assert.equal(offlineUntil.toISOString(), "2026-06-23T00:00:00.000Z");
});
