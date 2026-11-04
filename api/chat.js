import { getNewsletterDb } from "../server/firebase-admin.js";
import { createChatHandler } from "../server/chat.js";

export default createChatHandler({ getDb: getNewsletterDb });
