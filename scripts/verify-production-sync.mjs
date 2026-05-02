const DEFAULT_BASE_URL = "https://ungdungthongminh.shop";

const expectedApp = {
  id: "app-study-12",
  name: "Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học",
  slug: "phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc",
  description: "Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc."
};

const expectedProducts = {
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
    price: 1299000,
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

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status}`);
  }
  return {
    status: response.status,
    contentType: String(response.headers.get("content-type") || ""),
    text: await response.text()
  };
}

async function fetchHead(url) {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status}`);
  }
  return {
    status: response.status,
    contentType: String(response.headers.get("content-type") || ""),
    contentLength: Number(response.headers.get("content-length") || 0)
  };
}

function looksLikeHtml(payload) {
  const text = String(payload || "").toLowerCase();
  return text.includes("<html") || text.includes("<!doctype html");
}

function compareField(findings, label, actual, expected) {
  if (actual !== expected) {
    findings.push(`${label}: actual=${formatValue(actual)} expected=${formatValue(expected)}`);
  }
}

async function main() {
  const baseUrl = String(process.argv[2] || process.env.PROD_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, "");

  const [health, googleConfig, catalog, homepage] = await Promise.all([
    fetchJson(`${baseUrl}/api/health`),
    fetchJson(`${baseUrl}/api/auth/google/config`),
    fetchJson(`${baseUrl}/api/catalog`),
    fetchText(`${baseUrl}/`)
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

  const homepageHtml = String(homepage.text || "");
  if (!/hoctap-cap-01\.vercel\.app/i.test(homepageHtml)) {
    findings.push("Homepage missing Windows download CTA link to hoctap-cap-01 pricing");
  }
  if (!/Tai app cho Windows|Tải app cho Windows/i.test(homepageHtml)) {
    findings.push("Homepage missing Windows download CTA text");
  }

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Health: environment=${health.environment} paymentProviderMode=${health.paymentProviderMode} database=${health.database}`);
  console.log(`Google config: enabled=${Boolean(googleConfig.enabled)} clientIdPresent=${Boolean(googleConfig.clientId)}`);
  console.log("Desktop update artifacts: skipped (app-owned distribution flow)");

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