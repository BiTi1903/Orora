import {getNewsletterDb} from '../../server/firebase-admin.js';
import {createStorefrontHandler} from '../../server/storefront.js';
export default createStorefrontHandler({getDb:getNewsletterDb});
