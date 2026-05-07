// Test R2 stream trực tiếp với relative path
const { getR2ArtifactStream } = require('./src/modules/artifactStorage');
require('dotenv').config();

async function main() {
  const paths = [
    'app-bds-website-manager/Setup_BDS.exe',
    'app-prompt-image-video/Setup_VideoCreator.exe',
    'map-pro/Setup_MapPro.exe',
    'app-study-12/HocHungKhoi_Desktopapp-Win.exe',
  ];

  for (const p of paths) {
    try {
      const result = await getR2ArtifactStream(p);
      if (result && result.stream) {
        result.stream.destroy(); // Don't actually download
        console.log(`✅ R2 stream OK: ${p} (${(result.contentLength/1024/1024).toFixed(1)}MB, type: ${result.contentType})`);
      } else {
        console.log(`❌ R2 stream returned null: ${p}`);
      }
    } catch (e) {
      console.log(`❌ R2 stream ERROR: ${p} → ${e.message}`);
    }
  }
}
main();
