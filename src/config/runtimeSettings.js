const fs = require("fs");
const path = require("path");

const settingsFile = path.join(__dirname, "..", "..", "runtime-settings.json");

function ensureSettingsFile() {
  if (!fs.existsSync(settingsFile)) {
    const initial = {
      paymentProviderMode: "",
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
    bankCode: sepay.bankCode || "",
    bankAccountNumber: sepay.bankAccountNumber || "",
    accountName: sepay.accountName || "",
    qrTemplateUrl: sepay.qrTemplateUrl || ""
  };
}

function updateSepayRuntimeSettings(input) {
  const all = readRuntimeSettings();
  const next = {
    ...all,
    paymentProviderMode: input.paymentProviderMode || all.paymentProviderMode || "",
    sepay: {
      ...(all.sepay || {}),
      webhookSecret: input.webhookSecret || "",
      bankCode: input.bankCode || "",
      bankAccountNumber: input.bankAccountNumber || "",
      accountName: input.accountName || "",
      qrTemplateUrl: input.qrTemplateUrl || ""
    }
  };

  return writeRuntimeSettings(next);
}

module.exports = {
  readRuntimeSettings,
  writeRuntimeSettings,
  getSepayRuntimeSettings,
  updateSepayRuntimeSettings
};
