import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";

const checklistPath = path.join(process.cwd(), "docs", "ai-gates", "definition-ready-done.yaml");

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
  console.log(`Required items: Ready=${readyTotal}, Done=${doneTotal}`);
}

main();
