import {getNewsletterDb} from '../server/firebase-admin.js';
import {createShareImageHandler} from '../server/share-image.js';
export default createShareImageHandler({getDb:getNewsletterDb});
