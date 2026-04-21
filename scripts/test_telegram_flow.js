(async () => {
  try {
    const base = "http://localhost:3905";
    const email = `tgflow${Date.now()}@mail.test`;
    const password = "12345678";

    const registerRes = await fetch(`${base}/api/auth/customer/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName: "TG Flow", password })
    });
    const registerBody = await registerRes.json();
    const cookie = String(registerRes.headers.get("set-cookie") || "").split(";")[0];

    const linkRes = await fetch(`${base}/api/customer/telegram/link`, {
      headers: { Cookie: cookie }
    });
    const linkBody = await linkRes.json();

    const webhookRes = await fetch(`${base}/api/integrations/telegram/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-bot-api-secret-token": "telegram-webhook-secret"
      },
      body: JSON.stringify({
        message: {
          chat: { id: 99887766 },
          from: { username: "test_user" },
          text: `/start ${linkBody.startToken}`
        }
      })
    });
    const webhookBody = await webhookRes.json();

    const { pool } = require("../src/db/pool");
    const q = await pool.query(
      "SELECT telegram_chat_id, telegram_username FROM customers WHERE id = $1",
      [registerBody.customer.id]
    );
    await pool.end();

    console.log(
      JSON.stringify(
        {
          registerStatus: registerRes.status,
          linkStatus: linkRes.status,
          hasStartLink: Boolean(linkBody.startLink),
          webhookStatus: webhookRes.status,
          webhookOk: webhookBody.ok,
          linkedChat: q.rows[0]?.telegram_chat_id || "",
          linkedUsername: q.rows[0]?.telegram_username || ""
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
