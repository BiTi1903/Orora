import { createMicrosoftMailer } from "../server/microsoft-mail.js";

async function getDb() {
  const [
    { getApps, initializeApp, cert },
    { getFirestore },
  ] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/firestore"),
  ]);

  const credentials = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
  );

  if (
    !credentials.project_id ||
    !credentials.client_email ||
    !credentials.private_key
  ) {
    throw new Error(
      "firebase_server_configuration_missing"
    );
  }

  const app =
    getApps().find(
      (item) => item.name === "newsletter"
    ) ||
    initializeApp(
      {
        credential: cert(credentials),
      },
      "newsletter"
    );

  return getFirestore(app);
}

function getMailer() {
  const mailer = createMicrosoftMailer();
  return mailer;
}

export default async function bulkMail(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const reply = (status, data) =>
    res.status(status).json(data);

  // Chỉ cho phép POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(405, {
      ok: false,
      message: "Phương thức không được hỗ trợ.",
    });
  }

  // Kiểm tra admin secret
  const adminSecret = process.env.BULK_MAIL_SECRET;
  if (!adminSecret) {
    return reply(503, {
      ok: false,
      message: "BULK_MAIL_SECRET chưa được cấu hình trên server.",
    });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (token !== adminSecret) {
    return reply(401, {
      ok: false,
      message: "Không có quyền gửi email hàng loạt.",
    });
  }

  // Parse body
  let body;
  try {
    body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
  } catch {
    return reply(400, {
      ok: false,
      message: "Dữ liệu không hợp lệ.",
    });
  }

  const { subject, htmlContent, textContent, filter } = body || {};

  if (!subject || (!htmlContent && !textContent)) {
    return reply(400, {
      ok: false,
      message: "Vui lòng nhập tiêu đề và nội dung email.",
    });
  }

  // Kiểm tra Microsoft credentials
  const env = process.env;
  if (
    !env.MS_TENANT_ID ||
    !env.MS_CLIENT_ID ||
    !env.MS_CLIENT_SECRET
  ) {
    return reply(503, {
      ok: false,
      message: "Cấu hình Microsoft Mail chưa hoàn tất.",
    });
  }

  try {
    const db = await getDb();

    // Lấy danh sách subscribers
    let query = db.collection("newsletterSubscribers")
      .where("status", "==", "active");

    const snapshot = await query.get();
    const subscribers = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        subscribers.push({
          id: doc.id,
          email: data.email,
          createdAt: data.createdAt,
        });
      }
    });

    if (subscribers.length === 0) {
      return reply(200, {
        ok: true,
        message: "Không có subscriber nào để gửi.",
        sent: 0,
        failed: 0,
      });
    }

    // Lấy access token Microsoft
    const tenant = env.MS_TENANT_ID;
    const client = env.MS_CLIENT_ID;
    const secret = env.MS_CLIENT_SECRET;
    const sender = env.MS_SENDER_EMAIL || "sales@ororavn.com";

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
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

    if (!tokenRes.ok) {
      return reply(503, {
        ok: false,
        message: "Không thể xác thực với Microsoft.",
      });
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return reply(503, {
        ok: false,
        message: "Không nhận được access token từ Microsoft.",
      });
    }

    const accessToken = tokenData.access_token;

    // Gửi email cho từng subscriber (batch)
    let sent = 0;
    let failed = 0;
    const errors = [];

    // Gửi theo batch 10 email cùng lúc
    const BATCH_SIZE = 10;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const mailBody = {
            message: {
              subject,
              body: {
                contentType: htmlContent ? "HTML" : "Text",
                content: htmlContent || textContent,
              },
              toRecipients: [
                {
                  emailAddress: {
                    address: sub.email,
                  },
                },
              ],
            },
            saveToSentItems: false,
          };

          const mailRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(mailBody),
              signal: AbortSignal.timeout(15000),
            }
          );

          if (mailRes.status !== 202) {
            throw new Error(`HTTP ${mailRes.status}`);
          }

          return sub.email;
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          sent++;
        } else {
          failed++;
          errors.push(r.reason?.message || "unknown");
        }
      }

      // Delay giữa các batch (tránh rate limit)
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Lưu log gửi mail hàng loạt
    try {
      await db.collection("bulkMailLogs").add({
        subject,
        totalRecipients: subscribers.length,
        sent,
        failed,
        createdAt: new Date(),
      });
    } catch {
      // Không chặn response nếu lưu log lỗi
    }

    return reply(200, {
      ok: true,
      message: `Đã gửi ${sent}/${subscribers.length} email thành công.`,
      sent,
      failed,
      total: subscribers.length,
    });
  } catch (error) {
    console.error("Bulk mail error:", error);
    return reply(500, {
      ok: false,
      message: "Lỗi server khi gửi email hàng loạt.",
    });
  }
}
