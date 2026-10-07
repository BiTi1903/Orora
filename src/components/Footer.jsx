import { useEffect, useState } from "react";
import { getHomeContent } from "../lib/api";

function Footer({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const [home, setHome] = useState(null);

  useEffect(() => {
    if (preview) return;

    getHomeContent()
      .then((data) => {
        if (data) setHome(data);
      })
      .catch((err) => {
        console.error("Không thể tải nội dung Footer:", err);
      });
  }, [preview]);

  const data = preview && previewData ? previewData : home || {};

  const footerLogo = data.footerLogo || "ORORA";
  const footerDescription =
    data.footerDescription ||
    "Creating beautiful things with meaning and purpose.";

  const infoTitle = data.footerInfoTitle || "Information";
  const aboutText = data.footerAboutText || "About us";
  const shopText = data.footerShopText || "Shop";
  const termsText = data.footerTermsText || "Terms & Conditions";
  const privacyText = data.footerPrivacyText || "Privacy Policy";

  const contactTitle = data.footerContactTitle || "Contact";
  const phone = data.footerPhone || "0822.466.800";
  const email = data.footerEmail || "sales@ororavn.com";
  const address =
    data.footerAddress || "207A Nguyễn Văn Thủ, Tân Định, HCM";

  const socialTitle = data.footerSocialTitle || "Follow us";
  const instagram = data.footerInstagram || "#";
  const facebook = data.footerFacebook || "#";
  const tikTok = data.footerTikTok || "#";
  const youtube = data.footerYouTube || "#";

  const copyright =
    data.footerCopyright || "© 2026 ORORA. All rights reserved.";
  const companyNumber =
    data.footerCompanyNumber || "CTY TNHH ORORA No. 0123456789";

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const LinkOrSpan = ({ href, children, className, sel }) => {
    if (preview) {
      return (
        <span
          className={`${className || ""} ${selectedClass(sel)}`}
          data-builder-key={sel}
          onClick={select(sel)}
        >
          {children}
        </span>
      );
    }
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };

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
          >
            {footerLogo}
          </div>

          <p
            className={selectedClass("ftDesc")}
            data-builder-key={preview ? "ftDesc" : undefined}
            onClick={select("ftDesc")}
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
          >
            {infoTitle}
          </h3>

          <LinkOrSpan href="#about" sel="ftAbout">
            {aboutText}
          </LinkOrSpan>
          <LinkOrSpan href="#shop" sel="ftShop">
            {shopText}
          </LinkOrSpan>
          <LinkOrSpan href="#" sel="ftTerms">
            {termsText}
          </LinkOrSpan>
          <LinkOrSpan href="#" sel="ftPrivacy">
            {privacyText}
          </LinkOrSpan>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h3
            className={selectedClass("ftContactTitle")}
            data-builder-key={preview ? "ftContactTitle" : undefined}
            onClick={select("ftContactTitle")}
          >
            {contactTitle}
          </h3>

          {preview ? (
            <>
              <span
                className={selectedClass("ftPhone")}
                data-builder-key="ftPhone"
                onClick={select("ftPhone")}
              >
                {phone}
              </span>
              <span
                className={selectedClass("ftEmail")}
                data-builder-key="ftEmail"
                onClick={select("ftEmail")}
              >
                {email}
              </span>
              <p
                className={selectedClass("ftAddress")}
                data-builder-key="ftAddress"
                onClick={select("ftAddress")}
              >
                {address}
              </p>
            </>
          ) : (
            <>
              <a href={`tel:${phone}`}>{phone}</a>
              <a href={`mailto:${email}`}>{email}</a>
              <p>{address}</p>
            </>
          )}
        </div>

        {/* SOCIAL */}
        <div className="footer-column">
          <h3
            className={selectedClass("ftSocialTitle")}
            data-builder-key={preview ? "ftSocialTitle" : undefined}
            onClick={select("ftSocialTitle")}
          >
            {socialTitle}
          </h3>

          {preview ? (
            <>
              <span
                className={selectedClass("ftInstagram")}
                data-builder-key="ftInstagram"
                onClick={select("ftInstagram")}
              >
                Instagram
              </span>
              <span
                className={selectedClass("ftFacebook")}
                data-builder-key="ftFacebook"
                onClick={select("ftFacebook")}
              >
                Facebook
              </span>
              <span
                className={selectedClass("ftTikTok")}
                data-builder-key="ftTikTok"
                onClick={select("ftTikTok")}
              >
                TikTok
              </span>
              <span
                className={selectedClass("ftYouTube")}
                data-builder-key="ftYouTube"
                onClick={select("ftYouTube")}
              >
                YouTube
              </span>
            </>
          ) : (
            <>
              <a href={instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href={facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a href={tikTok} target="_blank" rel="noreferrer">
                TikTok
              </a>
              <a href={youtube} target="_blank" rel="noreferrer">
                YouTube
              </a>
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
          >
            {copyright}
          </span>
        </div>

        <div>
          <span
            className={selectedClass("ftCompany")}
            data-builder-key={preview ? "ftCompany" : undefined}
            onClick={select("ftCompany")}
          >
            {companyNumber}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;