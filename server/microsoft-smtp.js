import { newMailTracking } from "./mail-tracking.js";
import nodemailer from "nodemailer";
import { DEFAULT_WELCOME } from "./newsletter-content.js";

const failure = (message, status) => Object.assign(new Error(message), status ? { status } : {});

function authDetails(error) {
  // Keep only status codes and fixed categories, never the raw server response.
  const response = typeof error.response === "string" ? error.response : "";
  const responseCode = Number(error.responseCode);
  let reason = "authentication_rejected";
  if (/smtpclientauthentication is disabled|smtp auth(?:entication)? is disabled/i.test(response)) reason = "smtp_auth_disabled";
  else if (/security defaults|blocked by.*policy|disabled by.*security/i.test(response)) reason = "security_policy";
  else if (/invalid (?:access )?token|token (?:has )?expired/i.test(response)) reason = "access_token_invalid";
  return {
    responseCode: Number.isInteger(responseCode) && responseCode >= 400 && responseCode <= 599 ? responseCode : undefined,
    enhancedCode: response.match(/\b[245]\.\d{1,3}\.\d{1,3}\b/)?.[0],
    reason,
  };
}


function beforeSubmission(error) {
  // Nodemailer also labels post-DATA socket errors CONN. Only classify a
  // failure as pre-submission when its phase or command actually proves it.
  if (["CONNECT_TIMEOUT", "GREETING_TIMEOUT", "UPGRADE_TIMEOUT"].includes(error.timeoutType)) return true;
  if (["EDNS", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"].includes(error.code) || ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"].includes(error.originalCode)) return true;
  return /^(?:EHLO|HELO|STARTTLS|AUTH(?: .*)?|MAIL FROM|RCPT TO)$/.test(error.command || "");
}


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
      connectionTimeout: 15000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    const tracking = { ...newMailTracking(sender), transport: "smtp" };
    let deadline;
    try {
      // Cap total SMTP work as well as per-socket inactivity, leaving time for
      // token lookup and the final database write inside the 60-second Function.
      const result = await Promise.race([transport.sendMail({
        from: { name: "ORORA", address: sender },
        to: [{ address: email }],
        envelope: { from: sender, to: [email] },
        subject: message.subject, text: message.text, messageId: tracking.internetMessageId,
        headers: {
          "X-Orora-Mail-Id": tracking.trackingId,
          ...(message.unsubscribeUrl ? { "List-Unsubscribe": `<${message.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {}),
        },
      }), new Promise((_, reject) => {
        deadline = setTimeout(() => reject(failure("mail_smtp_outcome_unknown")), 35000);
      })]);
      const accepted = (result.accepted || []).some((recipient) => String(recipient.address || recipient).toLowerCase() === email.toLowerCase());
      if (!accepted) throw failure("mail_send_failed");
      // SMTP acceptance confirms queue submission, not final delivery.
      return tracking;
    } catch (error) {
      const tracked = (value) => Object.assign(value, { mailTracking: tracking });
      if (error.message === "mail_send_failed") throw tracked(error);
      if (error.code === "EAUTH") {
        cachedToken = undefined;
        expiresAt = 0;
        throw tracked(Object.assign(failure("mail_smtp_auth_failed"), { smtp: authDetails(error) }));
      }
      if (Number(error.responseCode) >= 400 && Number(error.responseCode) <= 599) {
        const { responseCode, enhancedCode } = authDetails(error);
        throw tracked(Object.assign(failure("mail_send_failed", Number(error.responseCode)), { smtp: { responseCode, enhancedCode } }));
      }
      if (beforeSubmission(error)) throw tracked(failure("mail_smtp_connection_failed"));
      // A dropped connection during DATA can occur after acceptance. Do not auto-resend.
      throw tracked(failure("mail_smtp_outcome_unknown"));
    } finally {
      clearTimeout(deadline);
      transport.close?.();
    }
  };
}
