module.exports = async (req, res) => {
  try {
    const { app, prepareServer } = require("../src/server");
    await prepareServer();
    return app(req, res);
  } catch (error) {
    console.error("Vercel bootstrap failed", error);

    const statusCode = Number(error?.statusCode) || 500;
    const payload = {
      message: error?.message || "Server bootstrap failed",
      code: error?.code || "SERVER_STARTUP_FAILED"
    };

    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
  }
};