const { pool } = require("./pool");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO apps(id, name, slug, status, description)
       VALUES
         ('app-study-12', 'Phan mem hoc tap khoi cap 01', 'phan-mem-hoc-tap-khoi-cap-01', 'active', 'Nen tang hoc tap thong minh cho hoc sinh tieu hoc khoi cap 01.'),
         ('app-ai-writing', 'AI Writing Coach', 'ai-writing-coach', 'coming_soon', 'Cong cu viet va sua bai theo ngu canh hoc tap va cong viec.')
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         status = EXCLUDED.status,
         description = EXCLUDED.description`
    );

    await client.query(
      `INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active)
       VALUES
         ('prod-test-2k', 'app-study-12', 'INTERNAL Sepay Test', 'one_time', 2000, 'VND', 1, FALSE),
         ('prod-study-month', 'app-study-12', 'Goi Thang Tieu Chuan', 'monthly', 89000, 'VND', 120, TRUE),
         ('prod-study-year', 'app-study-12', 'Goi Nam Tieu Chuan', 'yearly', 599000, 'VND', 1800, TRUE),
         ('prod-study-premium-month', 'app-study-12', 'Goi Thang Cao Cap', 'monthly', 119000, 'VND', 240, TRUE),
         ('prod-study-premium-year', 'app-study-12', 'Goi Nam Cao Cap', 'yearly', 899000, 'VND', 3600, TRUE),
         ('prod-study-standard-lifetime', 'app-study-12', 'Goi Tron Doi Tieu Chuan', 'one_time', 999000, 'VND', 9990, TRUE),
         ('prod-study-premium-lifetime', 'app-study-12', 'Goi Tron Doi Cao Cap', 'one_time', 1599000, 'VND', 15990, TRUE),
         ('prod-study-topup', 'app-study-12', 'Top-up 300 Credit', 'one_time', 149000, 'VND', 300, TRUE)
       ON CONFLICT (id) DO UPDATE SET
         app_id = EXCLUDED.app_id,
         name = EXCLUDED.name,
         cycle = EXCLUDED.cycle,
         price = EXCLUDED.price,
         currency = EXCLUDED.currency,
         credits = EXCLUDED.credits,
         active = EXCLUDED.active`
    );

    await client.query(
      `INSERT INTO customers(id, email, full_name)
       VALUES ('cus-demo', 'demo@user.local', 'Demo Customer')
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         full_name = EXCLUDED.full_name`
    );

    await client.query(
      `INSERT INTO credit_wallets(customer_id, app_id, balance)
       VALUES ('cus-demo', 'app-study-12', 0)
       ON CONFLICT (customer_id, app_id) DO NOTHING`
    );

    await client.query(
      `INSERT INTO product_keys(id, product_id, key_value, status)
       VALUES
         (gen_random_uuid(), 'prod-test-2k', 'WST-TEST-2K-0001', 'available'),
         (gen_random_uuid(), 'prod-test-2k', 'WST-TEST-2K-0002', 'available'),
         (gen_random_uuid(), 'prod-study-month', 'WST-MONTH-0001-ABCD', 'available'),
         (gen_random_uuid(), 'prod-study-month', 'WST-MONTH-0002-EFGH', 'available'),
         (gen_random_uuid(), 'prod-study-year', 'WST-YEAR-0001-ABCD', 'available'),
         (gen_random_uuid(), 'prod-study-year', 'WST-YEAR-0002-EFGH', 'available'),
         (gen_random_uuid(), 'prod-study-premium-month', 'WST-PRE-MONTH-0001', 'available'),
         (gen_random_uuid(), 'prod-study-premium-month', 'WST-PRE-MONTH-0002', 'available'),
         (gen_random_uuid(), 'prod-study-premium-year', 'WST-PRE-YEAR-0001', 'available'),
         (gen_random_uuid(), 'prod-study-premium-year', 'WST-PRE-YEAR-0002', 'available'),
         (gen_random_uuid(), 'prod-study-standard-lifetime', 'WST-LIFE-STD-0001', 'available'),
         (gen_random_uuid(), 'prod-study-standard-lifetime', 'WST-LIFE-STD-0002', 'available'),
         (gen_random_uuid(), 'prod-study-premium-lifetime', 'WST-LIFE-PRM-0001', 'available'),
         (gen_random_uuid(), 'prod-study-premium-lifetime', 'WST-LIFE-PRM-0002', 'available'),
         (gen_random_uuid(), 'prod-study-topup', 'WST-TOPUP-0001-ABCD', 'available'),
         (gen_random_uuid(), 'prod-study-topup', 'WST-TOPUP-0002-EFGH', 'available')
       ON CONFLICT (key_value) DO NOTHING`
    );

    await client.query("COMMIT");
    console.log("Seed completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
