import { facebookFollowUrl } from "../lib/commerce";
import { cdnSrc, MAIN } from "../lib/cloudinary";
export default function FacebookFollowCard({ settings, fallbackUrl, textProps = () => ({}) }) {
  const url = facebookFollowUrl(settings?.url?.trim() || fallbackUrl);
  const image = typeof settings?.image === "string" ? settings.image.trim() : "";
  if (settings?.enabled === false || !image || !url) return null;
  return <aside className="facebook-follow-card" aria-label="Theo dõi ORORA trên Facebook">
    <a className="facebook-follow-image" href={url} target="_blank" rel="noopener noreferrer" aria-label="Mở trang Facebook ORORA"><img src={cdnSrc(image, MAIN)} alt="ORORA" loading="lazy" /></a>
    <a className="facebook-follow-button" href={url} target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8h1.9V2.4c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.4H7V13h2.7v9h3.8Z"/></svg><span {...textProps("pdFacebookLabel", "facebookLabel")}>{settings?.label?.trim() || "Facebook +"}</span></a>
  </aside>;
}
