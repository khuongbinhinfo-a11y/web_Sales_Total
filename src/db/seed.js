const { pool } = require("./pool");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO apps(id, name, slug, status, description)
       VALUES
         ('hoctap-cap-01', 'Học Hứng Khởi Tiểu Học - Desktop Offline', 'hoc-hung-khoi-tieu-hoc-desktop-offline', 'active', 'Ban desktop offline tap trung vao TTS theo lop 1 va lop 2.'),
         ('app-study-12', 'Phần mềm ôn tập cho khối cấp 01 và Tiền Tiểu học', 'phan-mem-on-tap-khoi-cap-01-tien-tieu-hoc', 'active', 'Nen tang on tap thong minh cho hoc sinh khoi cap 01 va Tien Tieu hoc.'),
         ('lamviec', 'Phần mềm làm việc', 'phan-mem-lam-viec', 'active', 'Bo cong cu phan mem phuc vu cong viec va tu dong hoa quy trinh.'),
         ('app-cap12', 'Phần mềm học tập khối cấp 12', 'phan-mem-hoc-tap-khoi-cap-12', 'active', 'San pham hoc tap khoi cap 12 gia test de kiem tra card va thanh toan.'),
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
         ('demo-map', 'lamviec', 'Phần Mềm Quét Data Khách Hàng Trên Google Map', 'one_time', 499000, 'VND', 3, TRUE),
         ('demo-hoc12', 'app-cap12', 'Phần mềm học tập khối cấp 12', 'one_time', 2000, 'VND', 1, TRUE),
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
         (gen_random_uuid(), 'demo-map', 'WST-MAP-0001', 'available'),
         (gen_random_uuid(), 'demo-map', 'WST-MAP-0002', 'available'),
         (gen_random_uuid(), 'demo-hoc12', 'WST-HOC12-TEST-0001', 'available'),
         (gen_random_uuid(), 'demo-hoc12', 'WST-HOC12-TEST-0002', 'available'),
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
