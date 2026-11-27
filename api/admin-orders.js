import { checkReview, reviewCollection } from "../server/mail-review.js";
import { createOutlookStatusReader } from "../server/outlook-status.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb, verifyAdminToken, getNewsletterUser } from "../server/firebase-admin.js";
import { createAdminOrdersHandler } from "../server/orders.js";
const admin = createAdminOrdersHandler({ getDb: getNewsletterDb, verifyToken: verifyAdminToken, lookupUser: getNewsletterUser, checkOutlook: createOutlookStatusReader(), sendMail: createMicrosoftMailer() });

export default async function handler(req,res) {
  if (req.query?.scheduledReview !== "1") return admin(req,res);
  res.setHeader("Cache-Control","no-store");
  if (req.method !== "GET" || !process.env.CRON_SECRET || req.headers.authorization !== "Bearer "+process.env.CRON_SECRET) return res.status(403).end();
  const db = await getNewsletterDb();
  const check = createOutlookStatusReader();
  for (const domain of ["orders","newsletter"]) {
    const due = await db.collection(reviewCollection(domain)).where("nextCheck",">",0).where("nextCheck","<=",Date.now()).orderBy("nextCheck").limit(30).get();
    await checkReview(db,domain,due.docs.map(doc=>doc.id),check);
  }
  return res.status(200).json({ok:true});
}
