import { getNewsletterDb } from '../server/firebase-admin.js';
import { createOrderTrackingHandler } from '../server/order-tracking.js';
export default createOrderTrackingHandler({ getDb:getNewsletterDb });
