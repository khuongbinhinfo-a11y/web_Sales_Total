const { app, prepareServer } = require("../src/server");

module.exports = async (req, res) => {
  await prepareServer();
  return app(req, res);
};