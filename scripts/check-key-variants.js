/**
 * check-key-variants.js
 * Tra license key trong DB bằng cách thử mọi biến thể ký tự dễ nhầm:
 *   O <-> 0,  I <-> 1,  B <-> 8,  Z <-> 2,  S <-> 5
 *
 * Dùng: node scripts/check-key-variants.js <KEY>
 * Ví dụ: node scripts/check-key-variants.js WSTL-MOBOIF8-E18F2E
 */

const { pool } = require("../src/db/pool");

const CONFUSABLES = [
  ["O", "0"],
  ["I", "1"],
  ["B", "8"],
  ["Z", "2"],
  ["S", "5"]
];

function buildVariants(key) {
  const candidates = new Set([key.toUpperCase()]);

  for (const [a, b] of CONFUSABLES) {
    for (const existing of [...candidates]) {
      if (existing.includes(a)) candidates.add(existing.replaceAll(a, b));
      if (existing.includes(b)) candidates.add(existing.replaceAll(b, a));
    }
  }

  return [...candidates].sort();
}

async function main() {
  const rawKey = process.argv[2];
  if (!rawKey) {
    console.error("Usage: node scripts/check-key-variants.js <KEY>");
    process.exit(1);
  }

  const variants = buildVariants(rawKey);
  console.log(`\nKey gốc   : ${rawKey.toUpperCase()}`);
  console.log(`Số biến thể: ${variants.length}`);
  console.log("Biến thể  :", variants.join(", "), "\n");

  const sql = `
    SELECT al.license_key, al.app_id, al.product_id, al.plan_code, al.status,
           al.expires_at, al.metadata, p.name AS product_name, p.cycle
    FROM app_licenses al
    LEFT JOIN products p ON p.id = al.product_id
    WHERE al.license_key = ANY($1::text[])
  `;

  let result;
  try {
    result = await pool.query(sql, [variants]);
  } catch (err) {
    console.error("Lỗi kết nối DB:", err.message);
    process.exitCode = 1;
    await pool.end().catch(() => {});
    return;
  }

  if (result.rowCount === 0) {
    console.log("⚠️  Không tìm thấy bản ghi license nào khớp với key (kể cả mọi biến thể ký tự).");
    console.log("   → Key này không tồn tại trong DB local, hoặc thuộc DB production.");
  } else {
    for (const row of result.rows) {
      const metadata = row.metadata || {};
      const tier = detectTier(row);
      console.log("✅ TÌM THẤY KEY:");
      console.log("  license_key :", row.license_key);
      console.log("  app_id      :", row.app_id);
      console.log("  product_id  :", row.product_id);
      console.log("  product_name:", row.product_name);
      console.log("  plan_code   :", row.plan_code);
      console.log("  cycle       :", row.cycle);
      console.log("  status      :", row.status);
      console.log("  expires_at  :", row.expires_at || "không giới hạn");
      console.log("  metadata    :", JSON.stringify(metadata, null, 2));
      console.log("  ─────────────────────────────────────────────────");
      console.log("  → GÓI SẼ ĐƯỢC RESOLVE LÀ:", tier.toUpperCase());
      console.log("  ─────────────────────────────────────────────────\n");
    }
  }

  await pool.end().catch(() => {});
}

function detectTier(row) {
  const pinnedStandard = new Set(["prod-study-month", "prod-study-year", "prod-study-standard-lifetime"]);
  const m = row.metadata || {};

  // Ưu tiên 1: metadata explicit
  const explicitTier = [m.planTier, m.tier, row.planTier, row.tier]
    .map((v) => String(v || "").toLowerCase().trim())
    .find(Boolean);
  if (explicitTier) return explicitTier;

  // Ưu tiên 2: metadata.features explicit override
  if (Array.isArray(m.features) && m.features.length > 0) {
    const feats = m.features.map((f) => String(f).trim());
    if (feats.includes("lesson.premium") || feats.includes("ai.voice")) return "premium (qua metadata.features)";
    return "standard (qua metadata.features)";
  }

  // Ưu tiên 3: pinned standard SKU
  const productId = String(row.product_id || "").toLowerCase();
  if (pinnedStandard.has(productId)) return "standard";

  // Fallback: token "premium" trong plan_code / product_id
  const tokens = [row.plan_code, row.product_id]
    .join(" ").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.includes("premium")) return "premium";
  if (tokens.includes("basic")) return "basic";
  return "standard";
}

main();
