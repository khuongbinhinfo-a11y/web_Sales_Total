#!/usr/bin/env node

function parseArgs(argv) {
  const options = {
    localBaseUrl: "http://localhost:3900",
    liveBaseUrl: "https://ungdungthongminh.shop",
    appId: "app-study-12",
    customerId: "cus-demo",
    apiKey: process.env.AI_APP_SHARED_KEY || process.env.WEB_TOTAL_AI_APP_KEY || "",
    includeLive: true
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--no-live") {
      options.includeLive = false;
      continue;
    }
    if (!arg.startsWith("--")) {
      continue;
    }
    const [rawKey, inlineValue] = arg.split("=", 2);
    const key = rawKey.slice(2);
    const nextValue = inlineValue ?? argv[i + 1];

    if (inlineValue === undefined && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      i += 1;
    }

    switch (key) {
      case "local":
      case "localBaseUrl":
        options.localBaseUrl = nextValue;
        break;
      case "live":
      case "liveBaseUrl":
        options.liveBaseUrl = nextValue;
        break;
      case "app":
      case "appId":
        options.appId = nextValue;
        break;
      case "customer":
      case "customerId":
        options.customerId = nextValue;
        break;
      case "api-key":
      case "apiKey":
        options.apiKey = nextValue;
        break;
      default:
        break;
    }
  }

  return options;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

function summarizeCatalog(catalogBody, appId) {
  const apps = Array.isArray(catalogBody?.apps) ? catalogBody.apps : [];
  const products = Array.isArray(catalogBody?.products) ? catalogBody.products : [];
  const app = apps.find((item) => item?.id === appId) || null;
  const appProducts = products.filter((item) => item?.appId === appId);
  return {
    appFound: Boolean(app),
    app,
    productCount: appProducts.length,
    productIds: appProducts.map((item) => item.id).sort()
  };
}

function diffLists(localList, liveList) {
  const localSet = new Set(localList);
  const liveSet = new Set(liveList);
  const onlyLocal = [...localSet].filter((id) => !liveSet.has(id)).sort();
  const onlyLive = [...liveSet].filter((id) => !localSet.has(id)).sort();
  return { onlyLocal, onlyLive };
}

async function inspectBase(baseUrl, appId) {
  const [health, catalog] = await Promise.all([
    fetchJson(`${baseUrl}/api/health`),
    fetchJson(`${baseUrl}/api/catalog`)
  ]);

  const catalogSummary = catalog.ok
    ? summarizeCatalog(catalog.body, appId)
    : { appFound: false, app: null, productCount: 0, productIds: [] };

  return { baseUrl, health, catalog, catalogSummary };
}

async function checkAiAppEndpoints(baseUrl, options) {
  if (!options.apiKey) {
    return {
      skipped: true,
      reason: "Missing shared key (set AI_APP_SHARED_KEY or WEB_TOTAL_AI_APP_KEY, or pass --api-key)"
    };
  }

  const headers = {
    "content-type": "application/json",
    "x-ai-app-key": options.apiKey
  };

  const verify = await fetchJson(`${baseUrl}/api/ai-app/licenses/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerId: options.customerId,
      appId: options.appId,
      licenseKey: "TEST"
    })
  });

  const list = await fetchJson(
    `${baseUrl}/api/ai-app/customers/${encodeURIComponent(options.customerId)}/licenses?appId=${encodeURIComponent(options.appId)}`,
    { headers: { "x-ai-app-key": options.apiKey } }
  );

  return {
    skipped: false,
    verify,
    list
  };
}

async function main() {
  const options = parseArgs(process.argv);

  const local = await inspectBase(options.localBaseUrl, options.appId);
  const live = options.includeLive
    ? await inspectBase(options.liveBaseUrl, options.appId)
    : null;

  const aiReview = await checkAiAppEndpoints(options.localBaseUrl, options);

  const drift = live
    ? diffLists(local.catalogSummary.productIds, live.catalogSummary.productIds)
    : null;

  const report = {
    timestamp: new Date().toISOString(),
    appId: options.appId,
    local,
    live,
    drift,
    aiReview,
    note: drift
      ? "onlyLocal != [] means local has products not synced to main domain"
      : "live check disabled (--no-live)"
  };

  console.log(JSON.stringify(report, null, 2));

  if (!local.health.ok || !local.catalog.ok) {
    process.exitCode = 2;
    return;
  }

  if (live && (!live.health.ok || !live.catalog.ok)) {
    process.exitCode = 3;
    return;
  }
}

main().catch((error) => {
  console.error("[review-ai-app-local] failed", error?.message || error);
  process.exit(1);
});
