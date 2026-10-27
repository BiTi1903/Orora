import nodemailer from "nodemailer";
import { DEFAULT_WELCOME } from "./newsletter-content.js";

const failure = (message, status) => Object.assign(new Error(message), status ? { status } : {});

export function createMicrosoftSmtpMailer(env = process.env, request = fetch, createTransport = nodemailer.createTransport) {
  let cachedToken;
  let expiresAt = 0;

  return async function sendMail(email, message = DEFAULT_WELCOME) {
    const tenant = env.MS_TENANT_ID;
    const client = env.MS_CLIENT_ID;
    const secret = env.MS_CLIENT_SECRET;
    const sender = env.MS_SENDER_EMAIL || "sales@ororavn.com";
    if (!tenant || !client || !secret) throw failure("mail_configuration_missing");

    if (!cachedToken || expiresAt <= Date.now()) {
      let response;
      try {
        response = await request(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: client, client_secret: secret,
            scope: "https://outlook.office365.com/.default",
            grant_type: "client_credentials",
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw failure("mail_auth_failed");
        const token = await response.json();
        if (!token.access_token) throw failure("mail_auth_failed");
        cachedToken = token.access_token;
        expiresAt = Date.now() + Math.max(0, Number(token.expires_in || 3600) - 120) * 1000;
      } catch {
        // No message has been submitted to SMTP at this stage.
        throw failure("mail_auth_failed");
      }
    }

    const transport = createTransport({
      host: "smtp.office365.com", port: 587, secure: false, requireTLS: true,
      tls: { minVersion: "TLSv1.2", servername: "smtp.office365.com", rejectUnauthorized: true },
      auth: { type: "OAuth2", user: sender, accessToken: cachedToken },
      connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    try {
      const result = await transport.sendMail({
        from: { name: "ORORA", address: sender },
        to: [{ address: email }],
        envelope: { from: sender, to: [email] },
        subject: message.subject, text: message.text,
      });
      const accepted = (result.accepted || []).some((recipient) => String(recipient.address || recipient).toLowerCase() === email.toLowerCase());
      if (!accepted) throw failure("mail_send_failed");
      // SMTP acceptance confirms queue submission, not final delivery.
    } catch (error) {
      if (error.message === "mail_send_failed") throw error;
      if (error.code === "EAUTH") {
        cachedToken = undefined;
        expiresAt = 0;
        throw failure("mail_smtp_auth_failed");
      }
      if (Number(error.responseCode) >= 400 && Number(error.responseCode) <= 599) {
        throw failure("mail_send_failed", Number(error.responseCode));
      }
      if (error.command === "CONN") throw failure("mail_smtp_connection_failed");
      // A dropped connection during DATA can occur after acceptance. Do not auto-resend.
      throw failure("mail_smtp_outcome_unknown");
    } finally {
      transport.close?.();
    }
  };
}
