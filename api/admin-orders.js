import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb, verifyAdminToken } from "../server/firebase-admin.js";
import { createAdminOrdersHandler } from "../server/orders.js";
export default createAdminOrdersHandler({ getDb: getNewsletterDb, verifyToken: verifyAdminToken, sendMail: createMicrosoftMailer() });
