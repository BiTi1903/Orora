import { createHash, randomUUID } from "node:crypto";

const hash = (value) =>
  createHash("sha256").update(value).digest("hex");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const SUCCESS_MESSAGE =
  "Đã nhận đăng ký của bạn. Vui lòng kiểm tra hộp thư và mục thư rác.";

export function createSubscribeHandler({
  getDb,
  sendWelcome,
  env = process.env,
}) {
  return async function subscribe(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const reply = (status, message) =>
      res.status(status).json({
        ok: status === 200,
        message,
      });

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");

      return reply(
        405,
        "Phương thức không được hỗ trợ."
      );
    }

    // Chỉ nhận đăng ký từ tên miền đã cấu hình.
    let origin;

    try {
      origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin;
    } catch {
      return reply(
        503,
        "Tính năng đăng ký chưa được cấu hình."
      );
    }

    if (req.headers.origin !== origin) {
      return reply(
        403,
        "Vui lòng đăng ký trực tiếp trên website ORORA."
      );
    }

    const contentType = String(
      req.headers["content-type"] || ""
    );

    if (!contentType.startsWith("application/json")) {
      return reply(
        415,
        "Dữ liệu đăng ký không hợp lệ."
      );
    }

    if (
      Number(req.headers["content-length"] || 0) > 2048
    ) {
      return reply(413, "Dữ liệu quá dài.");
    }

    let body;

    try {
      body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;
    } catch {
      return reply(
        400,
        "Dữ liệu đăng ký không hợp lệ."
      );
    }

    if (!body || typeof body !== "object") {
      return reply(
        400,
        "Dữ liệu đăng ký không hợp lệ."
      );
    }

    // Trường ẩn dùng để lọc một số bot tự điền form.
    if (body.website) {
      return reply(200, SUCCESS_MESSAGE);
    }

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const validEmail =
      /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);

    if (
      !validEmail ||
      email.length > 254 ||
      body.consent !== true
    ) {
      return reply(
        400,
        "Vui lòng nhập email hợp lệ và đồng ý đăng ký nhận tin."
      );
    }

    const ip = String(
      req.headers["x-vercel-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "unknown"
    )
      .split(",")[0]
      .trim();

    const now = Date.now();
    const attempt = randomUUID();

    let subscriber;

    try {
      const db = await getDb();

      subscriber = db
        .collection("newsletterSubscribers")
        .doc(hash(email));

      const ipLimit = db
        .collection("newsletterLimits")
        .doc(`ip-${hash(ip)}`);

      const dailyLimit = db
        .collection("newsletterLimits")
        .doc("global");

      const action = await db.runTransaction(
        async (transaction) => {
          const [saved, ipSnap, dailySnap] =
            await transaction.getAll(
              subscriber,
              ipLimit,
              dailyLimit
            );

          const prior = saved.data() || {};

          // Đã đăng ký và đã gửi thư: không gửi lại.
          if (
            prior.status === "active" &&
            prior.mailStatus === "accepted"
          ) {
            return "exists";
          }

          if (prior.nextAttemptAt > now) {
            return "wait";
          }

          const ipData = ipSnap.data() || {};
          const dayData = dailySnap.data() || {};

          const ipCount =
            ipData.resetAt > now ? ipData.count : 0;

          const dayCount =
            dayData.resetAt > now ? dayData.count : 0;

          // 5 lượt/IP/giờ và 100 lượt toàn website/24 giờ.
          if (ipCount >= 5 || dayCount >= 100) {
            return "limit";
          }

          transaction.set(ipLimit, {
            count: ipCount + 1,
            resetAt:
              ipData.resetAt > now
                ? ipData.resetAt
                : now + HOUR,
            expireAt: new Date(now + 2 * DAY),
          });

          transaction.set(dailyLimit, {
            count: dayCount + 1,
            resetAt:
              dayData.resetAt > now
                ? dayData.resetAt
                : now + DAY,
          });

          transaction.set(
            subscriber,
            {
              email,
              status: "active",
              source: "website-newsletter",
              consentVersion: "newsletter-v1",
              consentAt: new Date(now),
              createdAt:
                prior.createdAt || new Date(now),
              updatedAt: new Date(now),
              mailStatus: "pending",
              attempt,
              nextAttemptAt: now + DAY,
            },
            { merge: true }
          );

          return "send";
        }
      );

      if (action === "exists") {
        return reply(200, SUCCESS_MESSAGE);
      }

      if (action === "wait") {
        return reply(
          429,
          "Email này vừa được đăng ký. Hãy kiểm tra hộp thư và thử lại sau."
        );
      }

      if (action === "limit") {
        return reply(
          429,
          "Có nhiều yêu cầu đăng ký. Vui lòng thử lại sau."
        );
      }
    } catch {
      console.error(
        "Newsletter: database reservation failed"
      );

      return reply(
        503,
        "Chưa lưu được đăng ký. Vui lòng thử lại sau."
      );
    }

    let welcomeTracking;
    try {
      welcomeTracking = await sendWelcome(email);
    } catch (error) {
      const knownFailure = [
        "mail_auth_failed",
        "mail_send_failed",
        "mail_configuration_missing",
        "mail_smtp_auth_failed",
        "mail_smtp_connection_failed",
        "mail_transport_invalid",
        "unsubscribe_configuration_missing",
        "invalid_message",
      ].includes(error.message);

      try {
        await subscriber.set(
          {
            mailStatus: knownFailure
              ? "failed"
              : "unknown",
            nextAttemptAt:
              now +
              (knownFailure
                ? 10 * 60 * 1000
                : DAY),
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch {
        console.error(
          "Newsletter: could not record mail failure"
        );
      }

      console.error(
        "Newsletter: mail request failed"
      );

      return reply(
        503,
        "Đã lưu email, nhưng chưa xác nhận được việc gửi thư. Hãy kiểm tra hộp thư hoặc liên hệ sales@ororavn.com."
      );
    }

    try {
      await subscriber.set(
        {
          mailStatus: "accepted",
          ...(welcomeTracking?.trackingId ? { welcomeTracking, outlook: null } : {}),
          mailAcceptedAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch {
      // Microsoft đã nhận thư: không báo gửi thất bại
      // chỉ vì cập nhật trạng thái Firestore gặp lỗi.
      console.error(
        "Newsletter: mail accepted, status update failed"
      );
    }

    return reply(200, SUCCESS_MESSAGE);
  };
}
