const test = require("node:test");
const assert = require("node:assert/strict");

test("admin OTP can be sent through security sender even when default sender is missing", () => {
  const fakeConfig = {
    resendEnabled: true,
    resendApiKey: "resend-test-key",
    emailFromDefault: "",
    emailFromSecurity: "security@ungdungthongminh.shop",
    emailFromSupport: "",
    emailFromQuotes: "",
    emailFromCareers: "",
    emailReplyTo: "",
    gmailNotifyFrom: "",
    gmailNotifyEnabled: false,
    googleClientId: "",
    googleClientSecret: "",
    googleRefreshToken: ""
  };

  const { canSendResendMessageForPurpose } = require("./payment");
  const { isEmailOtpConfigured } = require("./emailOtp");

  assert.equal(canSendResendMessageForPurpose("admin_login:abc123", fakeConfig), true);
  assert.equal(isEmailOtpConfigured("admin_password_change", fakeConfig), true);
  assert.equal(canSendResendMessageForPurpose("signup", fakeConfig), false);
  assert.equal(isEmailOtpConfigured("signup", fakeConfig), false);
});
