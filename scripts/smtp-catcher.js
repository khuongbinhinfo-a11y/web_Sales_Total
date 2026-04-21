const fs = require("fs");
const path = require("path");
const { SMTPServer } = require("smtp-server");

const outputDir = path.join(process.cwd(), "backups");
const outputFile = path.join(outputDir, "smtp-last-email.txt");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const server = new SMTPServer({
  authOptional: false,
  onAuth(auth, session, callback) {
    callback(null, { user: auth.username || "local" });
  },
  disabledCommands: ["STARTTLS"],
  onData(stream, session, callback) {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => {
      const mail = Buffer.concat(chunks).toString("utf8");
      fs.writeFileSync(outputFile, mail, "utf8");
      const otp = (mail.match(/\b\d{6}\b/g) || []).slice(-1)[0] || "";
      if (otp) {
        fs.writeFileSync(path.join(outputDir, "smtp-last-otp.txt"), otp, "utf8");
      }
      console.log(`[smtp-catcher] received mail from ${session.envelope.mailFrom?.address || "unknown"}`);
      callback();
    });
    stream.on("error", callback);
  }
});

server.listen(2525, "127.0.0.1", () => {
  console.log("[smtp-catcher] listening on 127.0.0.1:2525");
  console.log(`[smtp-catcher] writing latest email to ${outputFile}`);
});
