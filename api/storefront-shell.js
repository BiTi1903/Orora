import {getNewsletterDb} from '../server/firebase-admin.js';
import {createStorefrontShellHandler} from '../server/storefront-shell.js';
export default createStorefrontShellHandler({getDb:getNewsletterDb});
