import { createStoreNotifier } from "../server/store-notification.js";
import { waitUntil } from "@vercel/functions";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb } from "../server/firebase-admin.js";
import { createOrderHandler } from "../server/orders.js";
const sendMail = createMicrosoftMailer();
export default createOrderHandler({ getDb: getNewsletterDb, schedule: process.env.VERCEL ? waitUntil : undefined, sendMail, notifyStore: createStoreNotifier(sendMail) });
