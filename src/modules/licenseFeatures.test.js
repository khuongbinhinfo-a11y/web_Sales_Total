const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AI_APP_STANDARD_FEATURES,
  AI_APP_PREMIUM_FEATURES,
  inferPlanTierFromLicense,
  resolveLicenseFeatures
} = require("./licenseFeatures");

test("inferPlanTierFromLicense keeps pinned standard SKUs as standard", () => {
  const standardSkus = [
    "prod-study-month",
    "prod-study-year",
    "prod-study-standard-lifetime"
  ];

  for (const productId of standardSkus) {
    const tier = inferPlanTierFromLicense({ productId, planCode: productId });
    assert.equal(tier, "standard", `Expected ${productId} to resolve as standard`);
  }
});

test("inferPlanTierFromLicense resolves premium only when explicit metadata is premium", () => {
  const tier = inferPlanTierFromLicense({
    productId: "prod-study-month",
    planCode: "prod-study-month",
    metadata: { planTier: "premium" }
  });

  assert.equal(tier, "premium");
});

test("resolveLicenseFeatures returns premium features for explicit premium metadata", () => {
  const features = resolveLicenseFeatures({
    productId: "prod-study-month",
    metadata: { planTier: "premium" }
  });

  assert.deepEqual(features, AI_APP_PREMIUM_FEATURES);
});

test("resolveLicenseFeatures returns standard features for pinned standard SKU", () => {
  const features = resolveLicenseFeatures({
    productId: "prod-study-year",
    planCode: "prod-study-year"
  });

  assert.deepEqual(features, AI_APP_STANDARD_FEATURES);
});
