const { pool } = require('./src/db/pool');
(async () => {
  try {
    // Xem columns của orders trước
    const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position`);
    console.log('Columns orders:', cols.rows.map(r => r.column_name).join(', '));

    const orders = await pool.query(`
      SELECT o.id, o.status, o.amount, o.currency, o.order_code,
             o.created_at, o.paid_at,
             c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    console.log('=== 10 DON HANG GAN NHAT ===');
    orders.rows.forEach(r => {
      console.log(JSON.stringify({
        id: r.id ? r.id.substring(0,12)+'...' : null,
        status: r.status,
        amount: r.amount,
        currency: r.currency,
        order_code: r.order_code,
        email: r.customer_email,
        created: r.created_at,
        paid_at: r.paid_at
      }));
    });

    const tableCheck = await pool.query(`SELECT tablename FROM pg_tables WHERE tablename IN ('webhook_logs','payment_logs','order_logs')`);
    console.log('\nBang log co trong DB:', tableCheck.rows.map(r => r.tablename));

    const paid = await pool.query(`SELECT COUNT(*) as cnt FROM orders WHERE status='paid'`);
    const pending = await pool.query(`SELECT COUNT(*) as cnt FROM orders WHERE status='pending'`);
    const all = await pool.query(`SELECT status, COUNT(*) as cnt FROM orders GROUP BY status`);
    console.log('\nTong don PAID:', paid.rows[0].cnt);
    console.log('Tong don PENDING:', pending.rows[0].cnt);
    console.log('Tat ca status:', all.rows);

    await pool.end();
  } catch(e) {
    console.error('Loi:', e.message);
    await pool.end();
  }
})();
