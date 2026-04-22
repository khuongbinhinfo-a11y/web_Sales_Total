const DEFAULT_BASE_URL = "https://ungdungthongminh.shop";

const expectedApp = {
  id: "app-study-12",
  name: "Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học",
  slug: "phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc",
  description: "Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc."
};

const expectedProducts = {
  "prod-test-2k": {
    name: "INTERNAL Sepay Test",
    cycle: "one_time",
    price: 2000,
    credits: 1,
    active: false
  },
  "prod-study-month": {
    name: "Goi Thang Tieu Chuan",
    cycle: "monthly",
    price: 89000,
    credits: 120,
    active: true
  },
  "prod-study-year": {
    name: "Goi Nam Tieu Chuan",
    cycle: "yearly",
    price: 599000,
    credits: 1800,
    active: true
  },
  "prod-study-premium-month": {
    name: "Goi Thang Cao Cap",
    cycle: "monthly",
    price: 119000,
    credits: 240,
    active: true
  },
  "prod-study-premium-year": {
    name: "Goi Nam Cao Cap",
    cycle: "yearly",
    price: 899000,
    credits: 3600,
    active: true
  },
  "prod-study-standard-lifetime": {
    name: "Goi Tron Doi Tieu Chuan",
    cycle: "one_time",
    price: 999000,
    credits: 9990,
    active: true
  },
  "prod-study-premium-lifetime": {
    name: "Goi Tron Doi Cao Cap",
    cycle: "one_time",
    price: 1599000,
    credits: 15990,
    active: true
  },
  "prod-study-topup": {
    name: "Top-up 300 Credit",
    cycle: "one_time",
    price: 149000,
    credits: 300,
    active: true
  }
};

function formatValue(value) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status}`);
  }
  return response.json();
}

function compareField(findings, label, actual, expected) {
  if (actual !== expected) {
    findings.push(`${label}: actual=${formatValue(actual)} expected=${formatValue(expected)}`);
  }
}

async function main() {
  const baseUrl = String(process.argv[2] || process.env.PROD_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, "");

  const [health, googleConfig, catalog] = await Promise.all([
    fetchJson(`${baseUrl}/api/health`),
    fetchJson(`${baseUrl}/api/auth/google/config`),
    fetchJson(`${baseUrl}/api/catalog`)
  ]);

  const findings = [];
  const app = Array.isArray(catalog.apps) ? catalog.apps.find((item) => item.id === expectedApp.id) : null;
  const products = new Map((Array.isArray(catalog.products) ? catalog.products : []).map((item) => [item.id, item]));

  if (!app) {
    findings.push(`Missing app in catalog: ${expectedApp.id}`);
  } else {
    compareField(findings, `${expectedApp.id}.name`, app.name, expectedApp.name);
    compareField(findings, `${expectedApp.id}.slug`, app.slug, expectedApp.slug);
    compareField(findings, `${expectedApp.id}.description`, app.description, expectedApp.description);
  }

  for (const [productId, expected] of Object.entries(expectedProducts)) {
    const actual = products.get(productId);
    if (!actual) {
      findings.push(`Missing product in catalog: ${productId}`);
      continue;
    }

    compareField(findings, `${productId}.name`, actual.name, expected.name);
    compareField(findings, `${productId}.cycle`, actual.cycle, expected.cycle);
    compareField(findings, `${productId}.price`, Number(actual.price), expected.price);
    compareField(findings, `${productId}.credits`, Number(actual.credits), expected.credits);
    compareField(findings, `${productId}.active`, Boolean(actual.active), expected.active);
  }

  if (!googleConfig.enabled) {
    findings.push("Google login disabled: /api/auth/google/config returns enabled=false");
  }

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Health: environment=${health.environment} paymentProviderMode=${health.paymentProviderMode} database=${health.database}`);
  console.log(`Google config: enabled=${Boolean(googleConfig.enabled)} clientIdPresent=${Boolean(googleConfig.clientId)}`);

  if (!findings.length) {
    console.log("Production sync OK");
    return;
  }

  console.log("Production sync FAILED");
  for (const finding of findings) {
    console.log(`- ${finding}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`verify-production-sync failed: ${error.message}`);
  process.exitCode = 1;
});