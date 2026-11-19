import { Link } from "react-router-dom";
import {footerCopy} from "../lib/footer-copy";
import { contactLinks } from "../lib/contact";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";

function LinkOrSpan({ href, children, className, sel, preview, selectedClass, select, style, external = false }) {
  if (preview || !href || href === "#") {
    return (
      <span
        className={`${className || ""} ${preview ? selectedClass(sel) : ""}`.trim() || undefined}
        data-builder-key={preview ? sel : undefined}
        onClick={preview ? select(sel) : undefined}
        style={style}
      >
        {children}
      </span>
    );
  }
  if (!external && href.startsWith("/")) {
    return (
      <Link to={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} style={style} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {children}
    </a>
  );
}

function Footer({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const home=useHomeContent();

  const data = footerCopy(preview && previewData ? previewData : home || {});
  const { zalo } = contactLinks(data, "", data.productDetailStyles?.contactActions || {});
  const fs = data.footerStyles || {};
  const css = (key) => toCss(fs[key], { responsive: true });

  const footerLogo = data.footerLogo || "";
  const footerDescription =
    data.footerDescription || "";

  const infoTitle = data.footerInfoTitle || "";
  const aboutText = data.footerAboutText || "";
  const shopText = data.footerShopText || "";
  const termsText = data.footerTermsText || "";
  const privacyText = data.footerPrivacyText || "";

  const contactTitle = data.footerContactTitle || "";
  const phone = data.footerPhone || "";
  const email = data.footerEmail || "";
  const address =
    data.footerAddress || "";

  const socialTitle = data.footerSocialTitle || "";
  const instagram = data.footerInstagram || "";
  const facebook = data.footerFacebook || "";
  const tikTok = data.footerTikTok || "";
  const youtube = data.footerYouTube || "";

  const copyright =
    data.footerCopyright || "";
  const companyNumber =
    data.footerCompanyNumber || "";

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";


  return (
    <footer
      className={`footer ${preview ? "footer--preview" : ""}`}
      id={preview ? undefined : "contact"}
    >
      <div className="footer-main">
        {/* BRAND */}
        <div className="footer-brand">
          <div
            className={`footer-logo ${selectedClass("ftLogo")}`}
            data-builder-key={preview ? "ftLogo" : undefined}
            onClick={select("ftLogo")}
            style={css("logo")}
          >
            {footerLogo}
          </div>

          <p
            className={selectedClass("ftDesc")}
            data-builder-key={preview ? "ftDesc" : undefined}
            onClick={select("ftDesc")}
            style={css("description")}
          >
            {footerDescription}
          </p>
        </div>

        {/* INFORMATION */}
        <div className="footer-column">
          <h3
            className={selectedClass("ftInfoTitle")}
            data-builder-key={preview ? "ftInfoTitle" : undefined}
            onClick={select("ftInfoTitle")}
            style={css("columnTitle")}
          >
            {infoTitle}
          </h3>

          <LinkOrSpan preview={preview} selectedClass={selectedClass} select={select} style={css("link")} href="/#about" sel="ftAbout">
            {aboutText}
          </LinkOrSpan>
          <LinkOrSpan preview={preview} selectedClass={selectedClass} select={select} style={css("link")} href="/#shop" sel="ftShop">
            {shopText}
          </LinkOrSpan>
          {(data.footerTrackingText ?? 'Tra cứu đơn hàng') && <LinkOrSpan preview={preview} selectedClass={selectedClass} select={select} style={css("link")} href="/tra-cuu-don-hang" sel="ftTracking">{data.footerTrackingText ?? 'Tra cứu đơn hàng'}</LinkOrSpan>}
          <LinkOrSpan preview={preview} selectedClass={selectedClass} select={select} style={css("link")} href="#" sel="ftTerms">
            {termsText}
          </LinkOrSpan>
          <LinkOrSpan preview={preview} selectedClass={selectedClass} select={select} style={css("link")} href="#" sel="ftPrivacy">
            {privacyText}
          </LinkOrSpan>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h3
            className={selectedClass("ftContactTitle")}
            data-builder-key={preview ? "ftContactTitle" : undefined}
            onClick={select("ftContactTitle")}
            style={css("columnTitle")}
          >
            {contactTitle}
          </h3>

          {zalo && (data.footerZaloText ?? "Zalo") && <LinkOrSpan preview={preview} selectedClass={selectedClass} select={select} style={css("link")} href={zalo} sel="ftZalo" external>{data.footerZaloText ?? "Zalo"}</LinkOrSpan>}
          {preview ? (
            <>
              <span
                className={selectedClass("ftPhone")}
                data-builder-key="ftPhone"
                onClick={select("ftPhone")}
                style={css("link")}
              >
                {phone}
              </span>
              <span
                className={selectedClass("ftEmail")}
                data-builder-key="ftEmail"
                onClick={select("ftEmail")}
                style={css("link")}
              >
                {email}
              </span>
              <p
                className={selectedClass("ftAddress")}
                data-builder-key="ftAddress"
                onClick={select("ftAddress")}
                style={css("link")}
              >
                {address}
              </p>
            </>
          ) : (
            <>
              {phone && <a href={`tel:${phone}`} style={css("link")}>
                {phone}
              </a>}
              {email && <a href={`mailto:${email}`} style={css("link")}>
                {email}
              </a>}
              <p style={css("link")}>{address}</p>
            </>
          )}
        </div>

        {/* SOCIAL */}
        <div className="footer-column">
          <h3
            className={selectedClass("ftSocialTitle")}
            data-builder-key={preview ? "ftSocialTitle" : undefined}
            onClick={select("ftSocialTitle")}
            style={css("columnTitle")}
          >
            {socialTitle}
          </h3>

          {preview ? (
            <>
              <span
                className={selectedClass("ftInstagram")}
                data-builder-key="ftInstagram"
                onClick={select("ftInstagram")}
                style={css("link")}
              >
                Instagram
              </span>
              <span
                className={selectedClass("ftFacebook")}
                data-builder-key="ftFacebook"
                onClick={select("ftFacebook")}
                style={css("link")}
              >
                Facebook
              </span>
              <span
                className={selectedClass("ftTikTok")}
                data-builder-key="ftTikTok"
                onClick={select("ftTikTok")}
                style={css("link")}
              >
                TikTok
              </span>
              <span
                className={selectedClass("ftYouTube")}
                data-builder-key="ftYouTube"
                onClick={select("ftYouTube")}
                style={css("link")}
              >
                YouTube
              </span>
            </>
          ) : (
            <>
              {instagram && <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                style={css("link")}
              >
                Instagram
              </a>}
              {facebook && <a
                href={facebook}
                target="_blank"
                rel="noreferrer"
                style={css("link")}
              >
                Facebook
              </a>}
              {tikTok && <a
                href={tikTok}
                target="_blank"
                rel="noreferrer"
                style={css("link")}
              >
                TikTok
              </a>}
              {youtube && <a
                href={youtube}
                target="_blank"
                rel="noreferrer"
                style={css("link")}
              >
                YouTube
              </a>}
            </>
          )}
        </div>
      </div>

      {/* LICENSE */}
      <div className="footer-license">
        <div>
          <span
            className={selectedClass("ftCopyright")}
            data-builder-key={preview ? "ftCopyright" : undefined}
            onClick={select("ftCopyright")}
            style={css("copyright")}
          >
            {copyright}
          </span>
        </div>

        <div>
          <span
            className={selectedClass("ftCompany")}
            data-builder-key={preview ? "ftCompany" : undefined}
            onClick={select("ftCompany")}
            style={css("copyright")}
          >
            {companyNumber}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;