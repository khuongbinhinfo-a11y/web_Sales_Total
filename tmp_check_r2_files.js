const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const files = [
  "app-updates/app-bds-website-manager/Setup_BDS.exe",
  "app-updates/app-prompt-image-video/Setup_VideoCreator.exe",
  "app-updates/map-pro/Setup_MapPro.exe",
  "app-updates/hair-spa-manager/SalonManagerSetup-1.0.0.exe",
  "app-updates/app-study-12/HocHungKhoi_Desktopapp-Win.exe",
];

async function main() {
  for (const key of files) {
    try {
      const result = await client.send(new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key
      }));
      console.log(`✅ EXISTS: ${key} (${(result.ContentLength / 1024 / 1024).toFixed(1)} MB)`);
    } catch (e) {
      console.log(`❌ MISSING: ${key} (${e.name})`);
    }
  }
}
main();
