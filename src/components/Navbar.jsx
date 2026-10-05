import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <Link
        to="/"
        className="logo"
      >
        ORORA<span></span>
      </Link>

      <div className="nav-links">

        <Link to="/#about">
          Về Chúng Tôi
        </Link>

        <Link to="/#shop">
          Sản phẩm
        </Link>

        <Link to="/#contact">
          Liên Hệ
        </Link>

      </div>

      <button className="menu">
        ☰
      </button>

    </nav>
  );
}

export default Navbar;