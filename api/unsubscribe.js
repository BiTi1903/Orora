import { getNewsletterDb } from "../server/firebase-admin.js";
import { createUnsubscribeHandler } from "../server/unsubscribe.js";

export default createUnsubscribeHandler({ getDb: getNewsletterDb });
