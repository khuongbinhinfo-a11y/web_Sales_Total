const CAP01_PUBLIC_REDIRECT_URL = "https://hochungkhoi.site";
const CAP01_PUBLIC_REDIRECT_TITLE = "Học Tập Thông Minh Cấp 01";
const CAP01_PUBLIC_REDIRECT_DESCRIPTION = "Sản phẩm đã chuyển sang Học Chung Khối.";

const CAP01_BLOCKED_APP_IDS = new Set([
  "app-study-12",
  "hoctap-cap-01"
]);

const CAP01_BLOCKED_PRODUCT_IDS = new Set([
  "cap01_standard_1year_3grades",
  "cap01_grade_la_1year",
  "cap01_grade_1_1year",
  "cap01_grade_2_1year",
  "cap01_grade_3_1year",
  "cap01_grade_4_1year",
  "cap01_grade_5_1year",
  "prod-study-month",
  "prod-study-year",
  "prod-study-premium-month",
  "prod-study-premium-year",
  "prod-study-standard-lifetime",
  "prod-study-premium-lifetime",
  "prod-study-topup",
  "standard_1year_1grade",
  "cap01_beta_year_299"
]);

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase();
}

function isCap01AppId(appIdRaw) {
  return CAP01_BLOCKED_APP_IDS.has(normalizeToken(appIdRaw));
}

function isCap01ProductId(productIdRaw) {
  return CAP01_BLOCKED_PRODUCT_IDS.has(normalizeToken(productIdRaw));
}

function buildCap01MovedPayload() {
  return {
    ok: false,
    code: "CAP01_MOVED_TO_HOCHUNGKHOI",
    message: "Sản phẩm Cấp 01 đã chuyển sang Học Chung Khối.",
    redirectUrl: CAP01_PUBLIC_REDIRECT_URL
  };
}

function buildCap01MovedResponse(res) {
  return res.status(410).json(buildCap01MovedPayload());
}

module.exports = {
  CAP01_BLOCKED_APP_IDS,
  CAP01_BLOCKED_PRODUCT_IDS,
  CAP01_PUBLIC_REDIRECT_DESCRIPTION,
  CAP01_PUBLIC_REDIRECT_TITLE,
  CAP01_PUBLIC_REDIRECT_URL,
  buildCap01MovedPayload,
  buildCap01MovedResponse,
  isCap01AppId,
  isCap01ProductId
};
