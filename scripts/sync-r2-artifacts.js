const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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

async function main() {
  if (!fs.existsSync(root)) {
    throw new Error(`Path not found: ${root}`);
  }

  const files = walk(root);
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

main().catch((error) => {
  console.error("sync_failed", error.message || error);
  process.exit(1);
});
