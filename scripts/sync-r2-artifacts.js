const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config({ override: true });

const root = path.join(process.cwd(), "public", "app-updates");
const prefix = String(process.env.R2_PRIVATE_ARTIFACTS_PREFIX || "app-updates")
  .replace(/^\/+|\/+$/g, "");

if (!process.env.R2_BUCKET_ENDPOINT || !process.env.R2_BUCKET_NAME || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error("Missing R2 env vars");
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function parseArgs(argv) {
  return {
    verify: argv.includes("--verify")
  };
}

function isHeavyArtifact(filePath) {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const heavyExtensions = new Set([
    ".exe",
    ".msi",
    ".zip",
    ".7z",
    ".dmg",
    ".pkg",
    ".deb",
    ".rpm",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".iso"
  ]);
  const minHeavyBytes = 5 * 1024 * 1024;
  return heavyExtensions.has(ext) || stat.size >= minHeavyBytes;
}

async function verifyMode(files) {
  const heavyFiles = files.filter((filePath) => isHeavyArtifact(filePath));
  if (heavyFiles.length === 0) {
    console.log("verify_total 0");
    console.log("verify_pass 0");
    console.log("verify_fail 0");
    console.log("verify_result PASS");
    return;
  }

  let pass = 0;
  let fail = 0;

  for (const filePath of heavyFiles) {
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    const key = prefix ? `${prefix}/${rel}` : rel;

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        })
      );
      pass += 1;
      console.log(`verify PASS ${rel}`);
    } catch (error) {
      fail += 1;
      const reason = error?.name || error?.Code || error?.message || "UNKNOWN";
      console.log(`verify FAIL ${rel} (${reason})`);
    }
  }

  console.log(`verify_total ${heavyFiles.length}`);
  console.log(`verify_pass ${pass}`);
  console.log(`verify_fail ${fail}`);
  console.log(`verify_result ${fail === 0 ? "PASS" : "FAIL"}`);

  if (fail > 0) {
    process.exitCode = 2;
  }
}

async function syncMode(files) {
  let uploaded = 0;

  for (const filePath of files) {
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    const key = prefix ? `${prefix}/${rel}` : rel;
    const body = fs.readFileSync(filePath);

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: "application/octet-stream",
      })
    );

    uploaded += 1;
    if (uploaded % 10 === 0) {
      console.log(`uploaded ${uploaded}`);
    }
  }

  console.log(`uploaded_total ${uploaded}`);
}

async function main() {
  if (!fs.existsSync(root)) {
    throw new Error(`Path not found: ${root}`);
  }

  const files = walk(root);
  const args = parseArgs(process.argv.slice(2));

  if (args.verify) {
    await verifyMode(files);
    return;
  }

  await syncMode(files);
}

main().catch((error) => {
  console.error("sync_failed", error.message || error);
  process.exit(1);
});
