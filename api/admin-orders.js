import { createOutlookStatusReader } from "../server/outlook-status.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb, verifyAdminToken, getNewsletterUser } from "../server/firebase-admin.js";
import { createAdminOrdersHandler } from "../server/orders.js";
export default createAdminOrdersHandler({ getDb: getNewsletterDb, verifyToken: verifyAdminToken, lookupUser: getNewsletterUser, checkOutlook: createOutlookStatusReader(), sendMail: createMicrosoftMailer() });
