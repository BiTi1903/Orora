import { getNewsletterDb } from "../server/firebase-admin.js";
import { createSitemapHandler } from "../server/sitemap.js";
export default createSitemapHandler({ getDb: getNewsletterDb });
