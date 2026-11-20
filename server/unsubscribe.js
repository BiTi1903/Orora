import { validUnsubscribe } from "./newsletter-content.js";

function unsubscribePage({ title, heading, body, actionHtml = "", homeUrl = "https://ororavn.com/" }) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;background:#faf8f9;color:#181316;font:400 15px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.card{width:min(440px,100%);padding:30px 26px;background:#fff;border:1px solid #ece4e8;border-radius:20px;box-shadow:0 20px 50px rgba(24,14,20,.08);text-align:center}.brand{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b8446d;font-weight:700;margin:0 0 10px}h1{margin:0 0 10px;font-size:21px;line-height:1.3;color:#181316}p{margin:0 0 22px;color:#5b4d54;font-size:14px}.btn{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:46px;padding:12px 18px;border:0;border-radius:12px;background:#b8446d;color:#fff;font:600 15px/1.3 inherit;cursor:pointer;text-decoration:none}.btn:hover{background:#9f345b}.back{display:inline-block;margin-top:16px;color:#6c5d64;font-size:13px;text-decoration:none}.back:hover{color:#b8446d;text-decoration:underline}</style></head><body><main class="card"><p class="brand">ORORA</p><h1>${heading}</h1><p>${body}</p>${actionHtml}<a class="back" href="${homeUrl}">← Quay lại website ORORA</a></main></body></html>`;
}

export function createUnsubscribeHandler({ getDb, env = process.env }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).send("Phương thức không được hỗ trợ.");
    }
    const { id, token } = req.query || {};
    let homeUrl = "https://ororavn.com/";
    try { if (env?.NEWSLETTER_SITE_ORIGIN) homeUrl = `${new URL(env.NEWSLETTER_SITE_ORIGIN).origin}/`; } catch { /* fallback */ }
    try {
      if (!validUnsubscribe(id, token, env)) return res.status(400).send("Liên kết không hợp lệ.");
      if (req.method === "GET") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        // GET only shows confirmation: mail scanners must not unsubscribe recipients.
        return res.status(200).send(unsubscribePage({
          title: "ORORA – Hủy đăng ký",
          heading: "Hủy đăng ký nhận tin ORORA",
          body: "Xác nhận bên dưới nếu bạn không muốn nhận các email ưu đãi và tin tức tiếp theo từ ORORA.",
          actionHtml: '<form method="post"><button type="submit" class="btn">Xác nhận hủy đăng ký</button></form>',
          homeUrl,
        }));
      }
      const db = await getDb();
      const contact = db.collection("newsletterSubscribers").doc(id);
      await db.runTransaction(async (tx) => {
        const saved = await tx.get(contact);
        if (saved.exists && saved.data()?.status !== "unsubscribed") {
          tx.set(contact, { status: "unsubscribed", unsubscribedAt: new Date(), updatedAt: new Date() }, { merge: true });
        }
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(unsubscribePage({
        title: "ORORA – Đã hủy đăng ký",
        heading: "Đã hủy đăng ký nhận tin ORORA",
        body: "Email của bạn đã được ngừng nhận các chiến dịch tiếp theo. Cảm ơn bạn đã đồng hành cùng ORORA!",
        homeUrl,
      }));
    } catch {
      return res.status(503).send("Chưa thể hủy đăng ký. Vui lòng thử lại hoặc liên hệ sales@ororavn.com.");
    }
  };
}
