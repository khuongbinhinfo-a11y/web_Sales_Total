const test = require("node:test");
const assert = require("node:assert/strict");

const { isAdminOtpBypassed } = require("./auth");

test("admin OTP bypass matches the configured email and username only", () => {
  const config = {
    adminOtpBypassAccounts: ["khuongbinh.info@gmail.com", "@Binh2401"]
  };

  assert.equal(isAdminOtpBypassed({ email: "khuongbinh.info@gmail.com", username: "someone-else", role: "owner" }, config), true);
  assert.equal(isAdminOtpBypassed({ email: "other@example.com", username: "Binh2401", role: "owner" }, config), true);
  assert.equal(isAdminOtpBypassed({ email: "other@example.com", username: "@Binh2401", role: "owner" }, config), true);
  assert.equal(isAdminOtpBypassed({ email: "other@example.com", username: "manager01", role: "manager" }, config), false);
});
