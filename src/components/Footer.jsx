function Footer() {
  return (
    <footer className="footer" id="contact">

      <div className="footer-main">

        {/* BRAND */}

        <div className="footer-brand">

          <div className="footer-logo">
            ORORA<span>VN</span>
          </div>

          <p>
            Creating beautiful things
            <br />
            with meaning and purpose.
          </p>

        </div>

        {/* INFORMATION */}

        <div className="footer-column">

          <h3>
            Information
          </h3>

          <a href="#about">
            About us
          </a>

          <a href="#shop">
            Shop
          </a>

          <a href="#">
            Terms & Conditions
          </a>

          <a href="#">
            Privacy Policy
          </a>

        </div>

        {/* CONTACT */}

        <div className="footer-column">

          <h3>
            Contact
          </h3>

          <a href="tel:0900000000">
            0822.466.800
          </a>

          <a href="mailto:hello@yourbrand.com">
            sales@ororavn.com
          </a>

          <p>
            207A Nguyễn Văn Thủ, Tân Định, HCM
          </p>

        </div>

        {/* SOCIAL */}

        <div className="footer-column">

          <h3>
            Follow us
          </h3>

          <a href="#">
            Instagram
          </a>

          <a href="#">
            Facebook
          </a>

          <a href="#">
            TikTok
          </a>

          <a href="#">
            YouTube
          </a>

        </div>

      </div>

      {/* LICENSE */}

      <div className="footer-license">

        <div>
          <span>
            © 2026 ORORA. All rights reserved.
          </span>
        </div>

        <div>
          <span>
            CTY TNHH ORORA No. 0123456789
          </span>
        </div>

      </div>

    </footer>
  );
}

export default Footer;