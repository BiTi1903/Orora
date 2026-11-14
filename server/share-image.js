import {heroShareImage} from '../src/lib/share-image.js';
export function createShareImageHandler({getDb}) {
 return async (req, res) => {
  if (!['GET','HEAD'].includes(req.method)) {
   res.setHeader('Allow','GET, HEAD');
   return res.status(405).end();
  }
  try {
   const snapshot = await getDb().collection('settings').doc('home').get();
   res.setHeader('Location', heroShareImage(snapshot.exists ? snapshot.data() : {}));
   res.setHeader('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=60');
   return res.status(302).end();
  } catch {
   res.setHeader('Cache-Control','no-store');
   return res.status(503).end();
  }
 };
}
