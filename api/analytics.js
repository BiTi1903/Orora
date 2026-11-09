import { getNewsletterDb,verifyAdminToken } from '../server/firebase-admin.js';
import { createAnalyticsHandler } from '../server/analytics.js';
export default createAnalyticsHandler({getDb:getNewsletterDb,verifyToken:verifyAdminToken});
