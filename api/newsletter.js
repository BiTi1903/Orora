import { createOutlookStatusReader } from "../server/outlook-status.js";
import { getNewsletterDb, verifyAdminToken, getNewsletterUser } from "../server/firebase-admin.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";

export default createNewsletterAdminHandler({
  getDb: getNewsletterDb,
  verifyToken: verifyAdminToken,
  lookupUser: getNewsletterUser,
  checkOutlook: createOutlookStatusReader(), sendMail: createMicrosoftMailer(),
});
