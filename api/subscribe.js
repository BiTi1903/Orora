import { createStoreNotifier } from "../server/store-notification.js";
import { waitUntil } from "@vercel/functions";
import { createSubscribeHandler } from "../server/newsletter.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb } from "../server/firebase-admin.js";
import { sendWelcomeMessage } from "../server/newsletter-content.js";

const sendMail = createMicrosoftMailer();
export default createSubscribeHandler({
  getDb: getNewsletterDb,
  schedule: process.env.VERCEL ? waitUntil : undefined,
  notifyStore: createStoreNotifier(sendMail),
  sendWelcome: (email) => sendWelcomeMessage(email, { getDb: getNewsletterDb, sendMail }),
});
