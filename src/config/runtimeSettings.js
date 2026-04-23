const fs = require("fs");
const path = require("path");

const settingsFile = path.join(__dirname, "..", "..", "runtime-settings.json");

function resolveSepayWebhookUrl(explicitUrl = "", appBaseUrl = "") {
  const fallbackBaseUrl = String(appBaseUrl || "").trim();
  const rawUrl = String(explicitUrl || "").trim() || `${fallbackBaseUrl}/api/payments/webhooks/sepay`;

  if (!rawUrl) {
    return "";
  }

  try {
    const parsed = new URL(rawUrl);

    if (parsed.hostname === "ungdungthongminh.shop") {
      parsed.hostname = "www.ungdungthongminh.shop";
    }

    if (parsed.pathname === "/api/webhooks/sepay") {
      parsed.pathname = "/api/payments/webhooks/sepay";
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function ensureSettingsFile() {
  if (!fs.existsSync(settingsFile)) {
    const initial = {
      paymentProviderMode: "",
      aiApp: {
        sharedKey: "",
        keys: {
          web: "",
          desktop: ""
        }
      },
      sepay: {
        webhookSecret: "",
        bankCode: "",
        bankAccountNumber: "",
        accountName: "",
        qrTemplateUrl: ""
      }
    };
    fs.writeFileSync(settingsFile, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readRuntimeSettings() {
  ensureSettingsFile();
  try {
    const raw = fs.readFileSync(settingsFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRuntimeSettings(nextSettings) {
  ensureSettingsFile();
  fs.writeFileSync(settingsFile, JSON.stringify(nextSettings, null, 2), "utf8");
  return nextSettings;
}

function getSepayRuntimeSettings() {
  const all = readRuntimeSettings();
  const sepay = all.sepay || {};
  return {
    paymentProviderMode: all.paymentProviderMode || "",
    webhookSecret: sepay.webhookSecret || "",
    webhookUrl: resolveSepayWebhookUrl(sepay.webhookUrl || ""),
    bankCode: sepay.bankCode || "",
    bankAccountNumber: sepay.bankAccountNumber || "",
    accountName: sepay.accountName || "",
    qrTemplateUrl: sepay.qrTemplateUrl || ""
  };
}

function updateSepayRuntimeSettings(input) {
  const all = readRuntimeSettings();
  const currentSepay = all.sepay || {};
  const nextWebhookSecret = (() => {
    const rawValue = input.webhookSecret;
    if (typeof rawValue !== "string") {
      return currentSepay.webhookSecret || "";
    }

    const normalized = rawValue.trim();
    if (!normalized || normalized === "********") {
      return currentSepay.webhookSecret || "";
    }

    return normalized;
  })();

  const next = {
    ...all,
    paymentProviderMode: input.paymentProviderMode || all.paymentProviderMode || "",
    sepay: {
      ...currentSepay,
      webhookSecret: nextWebhookSecret,
      webhookUrl: resolveSepayWebhookUrl(
        typeof input.webhookUrl === "string" ? input.webhookUrl.trim() : (currentSepay.webhookUrl || "")
      ),
      bankCode: input.bankCode || "",
      bankAccountNumber: input.bankAccountNumber || "",
      accountName: input.accountName || "",
      qrTemplateUrl: input.qrTemplateUrl || ""
    }
  };

  return writeRuntimeSettings(next);
}

function getAiAppRuntimeSettings() {
  const all = readRuntimeSettings();
  const aiApp = all.aiApp || {};
  const keys = aiApp.keys || {};
  return {
    sharedKey: String(aiApp.sharedKey || "").trim(),
    keys: {
      web: String(keys.web || "").trim(),
      desktop: String(keys.desktop || "").trim()
    }
  };
}

function updateAiAppRuntimeSettings(input) {
  const all = readRuntimeSettings();
  const currentAiApp = all.aiApp || {};
  const currentKeys = currentAiApp.keys || {};

  const rawValue = input?.sharedKey;
  const nextSharedKey = typeof rawValue === "string"
    ? rawValue.trim()
    : String(currentAiApp.sharedKey || "").trim();

  const nextKeysInput = (input && typeof input.keys === "object" && input.keys) ? input.keys : {};
  const nextKeys = {
    web: typeof nextKeysInput.web === "string"
      ? nextKeysInput.web.trim()
      : String(currentKeys.web || "").trim(),
    desktop: typeof nextKeysInput.desktop === "string"
      ? nextKeysInput.desktop.trim()
      : String(currentKeys.desktop || "").trim()
  };

  const next = {
    ...all,
    aiApp: {
      ...currentAiApp,
      sharedKey: nextSharedKey,
      keys: nextKeys
    }
  };

  return writeRuntimeSettings(next);
}

module.exports = {
  readRuntimeSettings,
  writeRuntimeSettings,
  getSepayRuntimeSettings,
  updateSepayRuntimeSettings,
  getAiAppRuntimeSettings,
  updateAiAppRuntimeSettings,
  resolveSepayWebhookUrl
};
