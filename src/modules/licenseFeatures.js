const AI_APP_STANDARD_FEATURES = ["lesson.basic", "practice.core"];
const AI_APP_PREMIUM_FEATURES = ["lesson.basic", "practice.core", "lesson.premium", "ai.voice", "ai.writing"];

function inferPlanTierFromLicense(license) {
  const normalizedProductId = String(license?.productId || "").trim().toLowerCase();
  const pinnedStandardProductIds = new Set([
    "prod-study-month",
    "prod-study-year",
    "prod-study-standard-lifetime"
  ]);

  const explicitTierTokens = [
    license?.metadata?.planTier,
    license?.metadata?.tier,
    license?.planTier,
    license?.tier
  ]
    .map((value) => String(value || "").toLowerCase().trim())
    .filter(Boolean);

  if (explicitTierTokens.includes("premium")) {
    return "premium";
  }
  if (explicitTierTokens.includes("basic")) {
    return "basic";
  }
  if (explicitTierTokens.includes("standard")) {
    return "standard";
  }

  if (pinnedStandardProductIds.has(normalizedProductId)) {
    return "standard";
  }

  const tokens = [license?.planCode, license?.productId]
    .map((value) => String(value || "").toLowerCase())
    .join(" ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  // Premium only when the token is explicit.
  if (tokens.includes("premium")) {
    return "premium";
  }
  if (tokens.includes("basic")) {
    return "basic";
  }
  return "standard";
}

function resolveLicenseFeatures(license) {
  const rawFeatures = Array.isArray(license?.metadata?.features)
    ? license.metadata.features
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : null;

  if (rawFeatures && rawFeatures.length > 0) {
    return rawFeatures;
  }

  const tier = inferPlanTierFromLicense(license);
  if (tier === "premium") {
    return AI_APP_PREMIUM_FEATURES;
  }
  return AI_APP_STANDARD_FEATURES;
}

module.exports = {
  AI_APP_STANDARD_FEATURES,
  AI_APP_PREMIUM_FEATURES,
  inferPlanTierFromLicense,
  resolveLicenseFeatures
};
