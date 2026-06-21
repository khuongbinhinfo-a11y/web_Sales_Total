const { pool } = require("./pool");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO apps(id, name, slug, status, description)
       VALUES
         ('hoctap-cap-01', 'Hoc Hung Khoi Tieu Hoc - Desktop Offline', 'hoc-hung-khoi-tieu-hoc-desktop-offline', 'active', 'Ban desktop offline tap trung vao TTS theo lop 1 va lop 2.'),
         ('app-study-12', 'Phan mem on tap cho khoi cap 01 va Tien Tieu hoc', 'phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc', 'active', 'Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc.'),
         ('lamviec', 'Phan mem lam viec', 'phan-mem-lam-viec', 'active', 'Bo cong cu phan mem phuc vu cong viec va tu dong hoa quy trinh.'),
         ('app-cap12', 'Phan mem hoc tap khoi cap 12', 'phan-mem-hoc-tap-khoi-cap-12', 'active', 'San pham hoc tap khoi cap 12 gia test de kiem tra card va thanh toan.'),
         ('app-bloomia-pos', 'Bloomia Studio POS', 'bloomia-studio-pos', 'active', 'Phan mem ban hang va cap license rieng cho Bloomia Studio POS.'),
         ('app-ai-writing', 'AI Writing Coach', 'ai-writing-coach', 'coming_soon', 'Cong cu viet va sua bai theo ngu canh hoc tap va cong viec.')
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         status = EXCLUDED.status,
         description = EXCLUDED.description`
    );

    await client.query(
      `INSERT INTO products(id, app_id, name, cycle, price, currency, credits, active, fulfillment_mode, license_strategy)
       VALUES
         ('prod-test-2k', 'app-study-12', 'INTERNAL Sepay Test', 'one_time', 2000, 'VND', 1, FALSE, 'auto_license', 'legacy_hybrid'),
         ('demo-map', 'lamviec', 'Phan Mem Quet Data Khach Hang Tren Google Map', 'one_time', 499000, 'VND', 3, TRUE, 'auto_license', 'legacy_hybrid'),
         ('demo-hoc12', 'app-cap12', 'Phan mem hoc tap khoi cap 12', 'one_time', 2000, 'VND', 1, TRUE, 'auto_license', 'legacy_hybrid'),
         ('prod-bloomia-yearly', 'app-bloomia-pos', 'Bloomia Studio POS - Goi Nam', 'yearly', 0, 'VND', 0, FALSE, 'auto_license', 'generated_machine'),
         ('prod-bloomia-lifetime', 'app-bloomia-pos', 'Bloomia Studio POS - Vinh vien', 'one_time', 0, 'VND', 0, FALSE, 'auto_license', 'generated_machine')
       ON CONFLICT (id) DO UPDATE SET
         app_id = EXCLUDED.app_id,
         name = EXCLUDED.name,
         cycle = EXCLUDED.cycle,
         price = EXCLUDED.price,
         currency = EXCLUDED.currency,
         credits = EXCLUDED.credits,
         active = EXCLUDED.active,
         fulfillment_mode = EXCLUDED.fulfillment_mode,
         license_strategy = EXCLUDED.license_strategy`
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
         (gen_random_uuid(), 'demo-map', 'WST-MAP-0001', 'available'),
         (gen_random_uuid(), 'demo-map', 'WST-MAP-0002', 'available'),
         (gen_random_uuid(), 'demo-hoc12', 'WST-HOC12-TEST-0001', 'available'),
         (gen_random_uuid(), 'demo-hoc12', 'WST-HOC12-TEST-0002', 'available')
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
