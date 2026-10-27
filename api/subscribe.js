import { createSubscribeHandler } from "../server/newsletter.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { getNewsletterDb } from "../server/firebase-admin.js";
import { sendWelcomeMessage } from "../server/newsletter-content.js";

const sendMail = createMicrosoftMailer();
export default createSubscribeHandler({
  getDb: getNewsletterDb,
  sendWelcome: (email) => sendWelcomeMessage(email, { getDb: getNewsletterDb, sendMail }),
});
