import { reviewRecord, reviewCollection } from "./mail-review.js";
export function createStoreNotifier(sendMail, env = process.env) {
  return async function notifyStore(ref, { code, email }) {
    const recipient = env.STORE_NOTIFICATION_EMAIL || env.MS_SENDER_EMAIL || "sales@ororavn.com";
    let tracking;
    let state = "accepted";
    try {
      const page = code ? "/admin/orders" : "/admin/newsletter";
      const link = new URL(page, env.NEWSLETTER_SITE_ORIGIN || "https://ororavn.com").href;
      tracking = await sendMail(recipient, {
        subject: code ? "ORORA · Đơn hàng mới " + code : "ORORA · Có đăng ký nhận tin mới",
        text: (code ? "Cửa hàng vừa nhận đơn " + code + "." : "Khách vừa đăng ký nhận tin bằng email " + email + ".") + "\n\nMở trang quản trị: " + link,
      });
    } catch (error) {
      tracking = error.mailTracking;
      state = "unconfirmed";
      console.error("Store notification: mail delivery unconfirmed");
    }
    try {
      const record = reviewRecord("store", recipient, state, tracking, ref.path, code);
      const batch = ref.firestore.batch();
      batch.set(ref.firestore.collection(reviewCollection(code ? "orders" : "newsletter")).doc("store-" + ref.id), record);
      batch.update(ref, { storeNotification: { state, updatedAt:record.createdAt, trackingId:record.trackingId || "" } });
      await batch.commit();
    } catch {
      console.error("Store notification: could not record mail outcome");
    }
  };
}
