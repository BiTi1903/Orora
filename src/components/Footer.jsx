import { useEffect, useState } from "react";
import { getHomeContent } from "../lib/api";

function Footer() {
  const [home, setHome] = useState(null);

  useEffect(() => {
    getHomeContent()
      .then((data) => {
        if (data) {
          setHome(data);
        }
      })
      .catch((err) => {
        console.error("Không thể tải nội dung Footer:", err);
      });
  }, []);

  const footerLogo = home?.footerLogo || "ORORA";

  const footerDescription =
    home?.footerDescription ||
    "Creating beautiful things with meaning and purpose.";

  const infoTitle = home?.footerInfoTitle || "Information";
  const aboutText = home?.footerAboutText || "About us";
  const shopText = home?.footerShopText || "Shop";
  const termsText =
    home?.footerTermsText || "Terms & Conditions";
  const privacyText =
    home?.footerPrivacyText || "Privacy Policy";

  const contactTitle = home?.footerContactTitle || "Contact";
  const phone = home?.footerPhone || "0822.466.800";
  const email = home?.footerEmail || "sales@ororavn.com";
  const address =
    home?.footerAddress ||
    "207A Nguyễn Văn Thủ, Tân Định, HCM";

  const socialTitle = home?.footerSocialTitle || "Follow us";
  const instagram = home?.footerInstagram || "#";
  const facebook = home?.footerFacebook || "#";
  const tikTok = home?.footerTikTok || "#";
  const youtube = home?.footerYouTube || "#";

  const copyright =
    home?.footerCopyright ||
    "© 2026 ORORA. All rights reserved.";

  const companyNumber =
    home?.footerCompanyNumber ||
    "CTY TNHH ORORA No. 0123456789";

  return (
    <footer className="footer" id="contact">
      <div className="footer-main">

        {/* BRAND */}
        <div className="footer-brand">
          <div className="footer-logo">
            {footerLogo}
          </div>

          <p>
            {footerDescription}
          </p>
        </div>

        {/* INFORMATION */}
        <div className="footer-column">
          <h3>{infoTitle}</h3>

          <a href="#about">
            {aboutText}
          </a>

          <a href="#shop">
            {shopText}
          </a>

          <a href="#">
            {termsText}
          </a>

          <a href="#">
            {privacyText}
          </a>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h3>{contactTitle}</h3>

          <a href={`tel:${phone}`}>
            {phone}
          </a>

          <a href={`mailto:${email}`}>
            {email}
          </a>

          <p>
            {address}
          </p>
        </div>

        {/* SOCIAL */}
        <div className="footer-column">
          <h3>{socialTitle}</h3>

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
        </div>
      </div>

      {/* LICENSE */}
      <div className="footer-license">
        <div>
          <span>{copyright}</span>
        </div>

        <div>
          <span>{companyNumber}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;