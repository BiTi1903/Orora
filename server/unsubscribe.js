import { validUnsubscribe } from "./newsletter-content.js";

export function createUnsubscribeHandler({ getDb, env = process.env }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; form-action 'self'; frame-ancestors 'none'");
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).send("Phương thức không được hỗ trợ.");
    }
    const { id, token } = req.query || {};
    try {
      if (!validUnsubscribe(id, token, env)) return res.status(400).send("Liên kết không hợp lệ.");
      if (req.method === "GET") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        // GET only shows confirmation: mail scanners must not unsubscribe recipients.
        return res.status(200).send('<!doctype html><html lang="vi"><meta charset="utf-8"><title>ORORA – Hủy đăng ký</title><h1>Hủy đăng ký nhận tin ORORA</h1><p>Bạn sẽ không nhận các chiến dịch tiếp theo.</p><form method="post"><button type="submit">Xác nhận hủy đăng ký</button></form></html>');
      }
      const db = await getDb();
      const contact = db.collection("newsletterSubscribers").doc(id);
      await db.runTransaction(async (tx) => {
        const saved = await tx.get(contact);
        if (saved.exists && saved.data()?.status !== "unsubscribed") {
          tx.set(contact, { status: "unsubscribed", unsubscribedAt: new Date(), updatedAt: new Date() }, { merge: true });
        }
      });
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send("Đã hủy đăng ký nhận tin ORORA. Cảm ơn bạn!");
    } catch {
      return res.status(503).send("Chưa thể hủy đăng ký. Vui lòng thử lại hoặc liên hệ sales@ororavn.com.");
    }
  };
}
