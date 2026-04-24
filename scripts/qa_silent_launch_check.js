const {
  createCustomerAccount,
  manualGrantLicense,
  findAppLicenseByKey,
  verifyAppLicenseByKey
} = require("../src/modules/store");
const { pool } = require("../src/db/pool");

function logResult(name, pass, detail) {
  const status = pass ? "PASS" : "FAIL";
  console.log(`[${status}] ${name} - ${detail}`);
}

(async () => {
  const email = `qa.silent.launch.${Date.now()}@example.com`;
  let licenseKey = null;

  try {
    // Ensure test customer exists
    await createCustomerAccount(email, "QA Silent Launch");

    // Grant hidden product key
    const grant = await manualGrantLicense({
      customerEmail: email,
      productId: "standard_1year_1grade",
      adminNote: "QA silent launch automated check"
    });
    licenseKey = grant.licenseKey;

    // CASE 1: Active key verify should return expected spec
    const active = await verifyAppLicenseByKey({
      appId: "app-study-12",
      licenseKey,
      customerId: grant.customerId,
      deviceId: "QA-DEVICE-001",
      deviceName: "QA Device"
    });

    const case1Pass = Boolean(
      active &&
      active.planCode === "standard_1year_1grade" &&
      active.billingCycle === "yearly" &&
      active.status === "active" &&
      active.expiresAt &&
      active.metadata &&
      active.metadata.planId === "standard_1year_1grade" &&
      active.metadata.basePlan === "standard" &&
      active.metadata.subjects === "all" &&
      Number(active.metadata.grades) === 1 &&
      Number(active.metadata.profiles) === 2
    );
    logResult(
      "Case 1 - Active key spec",
      case1Pass,
      case1Pass
        ? `key=${licenseKey}, expiresAt=${active.expiresAt}`
        : `planCode=${active?.planCode}, billingCycle=${active?.billingCycle}, status=${active?.status}, metadata=${JSON.stringify(active?.metadata || {})}`
    );

    // CASE 2: Expired key should fail verify (fall back free at app side)
    await pool.query(
      "UPDATE app_licenses SET expires_at = NOW() - INTERVAL '1 day' WHERE license_key = $1",
      [licenseKey]
    );
    const expired = await verifyAppLicenseByKey({
      appId: "app-study-12",
      licenseKey,
      customerId: grant.customerId,
      deviceId: "QA-DEVICE-001",
      deviceName: "QA Device"
    });
    const case2Pass = expired === null;
    logResult(
      "Case 2 - Expired key drops access",
      case2Pass,
      case2Pass ? "verify returned null as expected" : "verify unexpectedly returned active license"
    );

    // CASE 3: Wrong plan signal must not elevate
    // We simulate a mismatched plan signal in metadata and ensure tier resolver does not become premium.
    await pool.query(
      "UPDATE app_licenses SET expires_at = NOW() + INTERVAL '1 year', status='active', metadata = (metadata || $2::jsonb) - 'planId' WHERE license_key = $1",
      [licenseKey, JSON.stringify({ planId: "wrong_plan_signal" })]
    );
    const wrongPlan = await findAppLicenseByKey({
      appId: "app-study-12",
      licenseKey,
      customerId: grant.customerId
    });
    const { inferPlanTierFromLicense, resolveLicenseFeatures, AI_APP_STANDARD_FEATURES } = require("../src/modules/licenseFeatures");
    const tier = inferPlanTierFromLicense(wrongPlan);
    const features = resolveLicenseFeatures(wrongPlan);

    const sameStandardFeatures =
      Array.isArray(features) &&
      features.length === AI_APP_STANDARD_FEATURES.length &&
      features.every((f, i) => f === AI_APP_STANDARD_FEATURES[i]);

    const case3Pass = tier === "standard" && sameStandardFeatures;
    logResult(
      "Case 3 - Wrong plan signal no privilege escalation",
      case3Pass,
      case3Pass
        ? "tier remained standard and features stayed standard"
        : `tier=${tier}, features=${JSON.stringify(features)}`
    );

    const allPass = case1Pass && case2Pass && case3Pass;
    console.log(`\nUAT SUMMARY: ${allPass ? "PASS" : "FAIL"}`);
    process.exitCode = allPass ? 0 : 1;
  } catch (error) {
    console.error("UAT execution error:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
