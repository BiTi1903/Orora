import { createMicrosoftSmtpMailer } from "./microsoft-smtp.js";
import { DEFAULT_WELCOME } from "./newsletter-content.js";

function createGraphMailer(
  env = process.env,
  request = fetch
) {
  let cachedToken;
  let expiresAt = 0;

  return async function sendMail(email, message = DEFAULT_WELCOME) {
    const tenant = env.MS_TENANT_ID;
    const client = env.MS_CLIENT_ID;
    const secret = env.MS_CLIENT_SECRET;
    const sender = env.MS_SENDER_EMAIL || "sales@ororavn.com";

    if (!tenant || !client || !secret) {
      throw new Error("mail_configuration_missing");
    }

    // Lấy access token Microsoft.
    if (!cachedToken || expiresAt <= Date.now()) {
      const response = await request(
        `https://login.microsoftonline.com/${encodeURIComponent(
          tenant
        )}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: client,
            client_secret: secret,
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials",
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error("mail_auth_failed");
      }

      const token = await response.json();

      if (!token.access_token) {
        throw new Error("mail_auth_failed");
      }

      cachedToken = token.access_token;

      expiresAt =
        Date.now() +
        Math.max(0, Number(token.expires_in || 3600) - 120) *
          1000;
    }

    const response = await request(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        sender
      )}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cachedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: message.subject,
            body: {
              contentType: "Text",
              content: message.text,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: email,
                },
              },
            ],
          },
          saveToSentItems: true,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    // 202 nghĩa là Microsoft đã tiếp nhận yêu cầu gửi.
    if (response.status !== 202) {
      if (response.status === 401) {
        cachedToken = undefined;
      }

      const error = new Error("mail_send_failed");
      error.status = response.status;
      throw error;
    }
  };
}

// Keep Graph active until SMTP permissions are configured. Never retry via a
// different transport automatically: the first submission may already exist.
export function createMicrosoftMailer(env = process.env, request = fetch) {
  const transport = String(env.MS_MAIL_TRANSPORT || "graph").trim().toLowerCase();
  if (transport === "smtp") return createMicrosoftSmtpMailer(env, request);
  if (transport === "graph") return createGraphMailer(env, request);
  return async () => { throw new Error("mail_transport_invalid"); };
}
