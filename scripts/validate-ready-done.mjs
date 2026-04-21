import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";

const gatesDir = path.join(process.cwd(), "docs", "ai-gates");
const defaultChecklist = "definition-ready-done.yaml";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--app" && argv[i + 1]) out.app = argv[i + 1];
    if (a.startsWith("--app=")) out.app = a.split("=")[1];
    if (a === "--branch" && argv[i + 1]) out.branch = argv[i + 1];
    if (a.startsWith("--branch=")) out.branch = a.split("=")[1];
  }
  return out;
}

function listAppSpecificFiles() {
  if (!fs.existsSync(gatesDir)) return [];
  return fs
    .readdirSync(gatesDir)
    .filter((f) => /^definition-ready-done\.[a-z0-9-]+\.ya?ml$/i.test(f));
}

function appNameFromBranch(branchName) {
  const b = normalizeSlug(branchName);
  if (!b) return "";

  if (/desktop|electron|pc-app/.test(b)) return "desktop";
  if (/webapp|frontend-web|site-app/.test(b)) return "webapp";
  if (/admin|backoffice|cms/.test(b)) return "admin";
  if (/mobile|android|ios/.test(b)) return "mobile";

  const tokens = b.split("-").filter(Boolean);
  return tokens[0] || "";
}

function resolveChecklistPath() {
  const args = parseArgs(process.argv.slice(2));
  const appFromArg = normalizeSlug(args.app || process.env.APP_NAME);
  const branch = args.branch || process.env.BRANCH_NAME || "";
  const appFromBranch = appNameFromBranch(branch);

  const appSpecificFiles = listAppSpecificFiles();
  const availableApps = appSpecificFiles.map((f) => f.replace(/^definition-ready-done\./i, "").replace(/\.ya?ml$/i, ""));

  const requestedApp = appFromArg || appFromBranch;
  if (requestedApp) {
    const expectedYaml = `definition-ready-done.${requestedApp}.yaml`;
    const expectedYml = `definition-ready-done.${requestedApp}.yml`;
    const exact = appSpecificFiles.find((f) => f.toLowerCase() === expectedYaml || f.toLowerCase() === expectedYml);
    if (exact) {
      return {
        path: path.join(gatesDir, exact),
        mode: `app-specific (${requestedApp})`
      };
    }

    if (appSpecificFiles.length && !availableApps.includes(requestedApp)) {
      console.warn(`No app-specific checklist found for '${requestedApp}'. Available: ${availableApps.join(", ")}`);
    }
  }

  return {
    path: path.join(gatesDir, defaultChecklist),
    mode: "default"
  };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertArray(value, fieldName) {
  if (!Array.isArray(value)) {
    fail(`${fieldName} must be an array`);
  }
}

function validateItems(items, sectionName) {
  const failed = [];
  const invalid = [];

  for (const item of items) {
    const id = String(item?.id || "").trim();
    const required = Boolean(item?.required);
    const passed = Boolean(item?.passed);
    const evidence = String(item?.evidence || "").trim();

    if (!id) {
      invalid.push(`${sectionName}: missing id`);
      continue;
    }

    if (required && !passed) {
      failed.push(`${sectionName}:${id}`);
    }

    if (required && !evidence) {
      invalid.push(`${sectionName}:${id} missing evidence`);
    }
  }

  return { failed, invalid };
}

function main() {
  const selection = resolveChecklistPath();
  const checklistPath = selection.path;

  if (!fs.existsSync(checklistPath)) {
    fail(`Missing checklist file: ${checklistPath}`);
  }

  const raw = fs.readFileSync(checklistPath, "utf8");
  const data = yaml.load(raw);

  if (!data || typeof data !== "object") {
    fail("Checklist YAML is invalid or empty");
  }

  const blockMerge = Boolean(data?.enforcement?.blockMerge);
  if (!blockMerge) {
    console.log("Definition Ready/Done gate skipped (blockMerge=false).");
    return;
  }

  assertArray(data.definitionOfReady, "definitionOfReady");
  assertArray(data.definitionOfDone, "definitionOfDone");

  const readyResult = validateItems(data.definitionOfReady, "definitionOfReady");
  const doneResult = validateItems(data.definitionOfDone, "definitionOfDone");

  const failed = [...readyResult.failed, ...doneResult.failed];
  const invalid = [...readyResult.invalid, ...doneResult.invalid];

  if (invalid.length) {
    console.error("Definition Ready/Done validation failed due to invalid checklist entries:");
    for (const item of invalid) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  if (failed.length) {
    console.error("Merge blocked: required checklist items not passed:");
    for (const item of failed) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  const readyTotal = data.definitionOfReady.filter((x) => x?.required).length;
  const doneTotal = data.definitionOfDone.filter((x) => x?.required).length;

  console.log("Definition Ready/Done gate passed.");
  console.log(`Checklist: ${path.relative(process.cwd(), checklistPath)} (${selection.mode})`);
  console.log(`Required items: Ready=${readyTotal}, Done=${doneTotal}`);
}

main();
