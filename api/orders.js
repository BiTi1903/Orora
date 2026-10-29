import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb } from "../server/firebase-admin.js";
import { createOrderHandler } from "../server/orders.js";
export default createOrderHandler({ getDb: getNewsletterDb, sendMail: createMicrosoftMailer() });
