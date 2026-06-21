const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const { pool } = require("../db/pool");
const {
  activateBloomiaLicense,
  verifyBloomiaLicense,
  resetBloomiaLicenseMachine
} = require("./store");

function createBloomiaRow(overrides = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    customer_id: "cus-bloomia",
    app_id: "app-bloomia-pos",
    product_id: "prod-bloomia-yearly",
    order_id: "22222222-2222-2222-2222-222222222222",
    plan_code: "yearly",
    billing_cycle: "yearly",
    license_key: "BLM-2222-3333-4444-5555-6666-7777-8888-9999",
    status: "inactive",
    activated_at: null,
    expires_at: "2027-06-21T00:00:00.000Z",
    device_id: null,
    device_name: null,
    last_verified_at: null,
    activation_token_hash: null,
    machine_id: null,
    machine_name: null,
    reset_count: 0,
    last_reset_at: null,
    last_reset_reason: null,
    last_reset_by_admin: null,
    metadata: {},
    created_at: "2026-06-21T00:00:00.000Z",
    updated_at: "2026-06-21T00:00:00.000Z",
    ...overrides
  };
}

function installBloomiaPoolStub(initialRow) {
  const state = {
    row: structuredClone(initialRow),
    renewalRows: []
  };
  const originalConnect = pool.connect;
  const originalQuery = pool.query;

  const client = {
    async query(sql, params = []) {
      const text = String(sql || "");
      if (/^\s*BEGIN/i.test(text) || /^\s*COMMIT/i.test(text) || /^\s*ROLLBACK/i.test(text)) {
        return { rowCount: 0, rows: [] };
      }

      if (/FROM app_licenses/i.test(text) && /WHERE license_key = \$1 AND app_id = \$2/i.test(text)) {
        const [licenseKey, appId] = params;
        if (licenseKey === state.row.license_key && appId === "app-bloomia-pos") {
          return { rowCount: 1, rows: [structuredClone(state.row)] };
        }
        return { rowCount: 0, rows: [] };
      }

      if (/FROM app_licenses/i.test(text) && /WHERE activation_token_hash = \$1/i.test(text)) {
        const [activationTokenHash] = params;
        if (activationTokenHash && activationTokenHash === state.row.activation_token_hash) {
          return { rowCount: 1, rows: [structuredClone(state.row)] };
        }
        return { rowCount: 0, rows: [] };
      }

      if (/UPDATE app_licenses/i.test(text) && /activation_token_hash = \$4/i.test(text)) {
        const [licenseId, machineId, machineName, activationTokenHash, metadataJson] = params;
        if (licenseId !== state.row.id) {
          return { rowCount: 0, rows: [] };
        }
        state.row = {
          ...state.row,
          status: "active",
          activated_at: state.row.activated_at || new Date("2026-06-21T00:00:00.000Z").toISOString(),
          last_verified_at: new Date("2026-06-21T00:00:00.000Z").toISOString(),
          device_id: state.row.device_id || machineId,
          device_name: state.row.device_name || machineName,
          activation_token_hash: activationTokenHash,
          machine_id: machineId,
          machine_name: machineName,
          metadata: JSON.parse(metadataJson),
          updated_at: new Date("2026-06-21T00:00:00.000Z").toISOString()
        };
        return { rowCount: 1, rows: [structuredClone(state.row)] };
      }

      if (/UPDATE app_licenses/i.test(text) && /SET status = 'active'/i.test(text) && /device_name = COALESCE\(\$3, device_name\)/i.test(text)) {
        const [licenseId, machineId, deviceName, metadataJson] = params;
        if (licenseId !== state.row.id) {
          return { rowCount: 0, rows: [] };
        }
        state.row = {
          ...state.row,
          last_verified_at: new Date("2026-06-21T00:00:00.000Z").toISOString(),
          device_name: deviceName || state.row.device_name,
          metadata: JSON.parse(metadataJson),
          updated_at: new Date("2026-06-21T00:00:00.000Z").toISOString()
        };
        return { rowCount: 1, rows: [structuredClone(state.row)] };
      }

      if (/UPDATE app_licenses/i.test(text) && /SET machine_id = NULL/i.test(text)) {
        const [licenseId, reason, adminId] = params;
        if (licenseId !== state.row.id) {
          return { rowCount: 0, rows: [] };
        }
        state.row = {
          ...state.row,
          machine_id: null,
          machine_name: null,
          activation_token_hash: null,
          device_id: null,
          device_name: null,
          status: "inactive",
          reset_count: state.row.reset_count + 1,
          last_reset_at: new Date("2026-06-21T00:00:00.000Z").toISOString(),
          last_reset_reason: reason,
          last_reset_by_admin: adminId,
          updated_at: new Date("2026-06-21T00:00:00.000Z").toISOString()
        };
        return { rowCount: 1, rows: [structuredClone(state.row)] };
      }

      throw new Error(`Unexpected SQL in Bloomia stub: ${text.slice(0, 120)}`);
    }
  };

  pool.connect = async () => {
    const clientInstance = {
      query: client.query,
      release() {}
    };
    return clientInstance;
  };
  pool.query = client.query;

  return {
    state,
    restore() {
      pool.connect = originalConnect;
      pool.query = originalQuery;
    }
  };
}

test("Bloomia activate bind machine and rotate token on same machine", async () => {
  const stub = installBloomiaPoolStub(createBloomiaRow());
  try {
    const first = await activateBloomiaLicense({
      appId: "app-bloomia-pos",
      licenseKey: "BLM-2222-3333-4444-5555-6666-7777-8888-9999",
      machineId: "MACHINE-A",
      deviceName: "Win32",
      appVersion: "0.1.0"
    });
    assert.equal(first.success, true);
    assert.equal(first.data.license.planCode, "yearly");
    assert.match(first.data.activationToken, /^[A-Za-z0-9_-]+$/);
    assert.equal(stub.state.row.machine_id, "MACHINE-A");

    const second = await activateBloomiaLicense({
      appId: "app-bloomia-pos",
      licenseKey: "BLM-2222-3333-4444-5555-6666-7777-8888-9999",
      machineId: "MACHINE-A",
      deviceName: "Win32",
      appVersion: "0.1.0"
    });
    assert.equal(second.success, true);
    assert.notEqual(second.data.activationToken, first.data.activationToken);

    const mismatch = await activateBloomiaLicense({
      appId: "app-bloomia-pos",
      licenseKey: "BLM-2222-3333-4444-5555-6666-7777-8888-9999",
      machineId: "MACHINE-B",
      deviceName: "Win32",
      appVersion: "0.1.0"
    });
    assert.equal(mismatch.ok, false);
    assert.equal(mismatch.code, "machine_mismatch");
  } finally {
    stub.restore();
  }
});

test("Bloomia verify updates lastVerifiedAt and reset clears activation token", async () => {
  const seedRow = createBloomiaRow({
    status: "active",
    activated_at: "2026-06-21T00:00:00.000Z",
    last_verified_at: "2026-06-21T00:00:00.000Z",
    machine_id: "MACHINE-A",
    machine_name: "Win32",
    activation_token_hash: crypto.createHash("sha256").update("TOKEN-1").digest("hex")
  });
  const stub = installBloomiaPoolStub(seedRow);
  try {
    const verify = await verifyBloomiaLicense({
      appId: "app-bloomia-pos",
      activationToken: "TOKEN-1",
      machineId: "MACHINE-A",
      deviceName: "Win32",
      appVersion: "0.1.0"
    });
    assert.equal(verify.success, true);
    assert.equal(stub.state.row.last_verified_at, "2026-06-21T00:00:00.000Z");

    const reset = await resetBloomiaLicenseMachine({
      licenseId: seedRow.id,
      adminId: "33333333-3333-3333-3333-333333333333",
      reason: "Khach thay may"
    });
    assert.equal(reset.machineId, null);
    assert.equal(reset.activationTokenHash, null);
    assert.equal(reset.resetCount, 1);
  } finally {
    stub.restore();
  }
});
