import {cdnSrc} from './image-cdn.js';
export const SHARE_IMAGE_PATH = '/api/share-image?v=hero-1';

// Share the same hero chosen in admin. JPEG is widely supported by link crawlers.
export function heroShareImage(home = {}, origin = 'https://ororavn.com') {
 for (const value of [home.heroImage, home.heroImageMobile, home.heroMobileImage, '/hero.jpg']) {
  if (typeof value !== 'string' || !value.trim()) continue;
  try {
   const url = new URL(value.trim(), origin);
   if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
   return cdnSrc(url.href, {w:1200, q:'auto:good'}).replace('/upload/f_auto,', '/upload/f_jpg,');
  } catch { /* Try the next configured hero or the local fallback. */ }
 }
}
