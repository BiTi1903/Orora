import { createInventoryHandler } from "../server/inventory.js";
import { getNewsletterDb, verifyAdminToken } from "../server/firebase-admin.js";
export default createInventoryHandler({ getDb: getNewsletterDb, verifyToken: verifyAdminToken });
