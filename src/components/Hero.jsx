import { useEffect, useState } from "react";
import { Sparkles } from "./Extras";

const WORDS = ["dịu nhẹ", "rạng rỡ", "tự tin", "tỏa sáng"];

function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  const handleMove = (e) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const handleLeave = (e) => {
    e.currentTarget.style.setProperty("--px", 0);
    e.currentTarget.style.setProperty("--py", 0);
  };

  return (
    <section className="hero" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <Sparkles />

      {/* thẻ kính nổi */}
      <div className="hero-chip chip-1" style={{ "--d": 40 }}>
        <span className="chip-in"><b>✦</b> Dịu nhẹ cho da</span>
      </div>
      <div className="hero-chip chip-2" style={{ "--d": -55 }}>
        <span className="chip-in"><b>♡</b> Thành phần thuần khiết</span>
      </div>
      <div className="hero-chip chip-3" style={{ "--d": 30 }}>
        <span className="chip-in"><b>✧</b> Cấp ẩm sâu</span>
      </div>

      {/* vòng chữ xoay */}
      <div className="hero-ring" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <defs>
            <path id="ringPath" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
          </defs>
          <text>
            <textPath href="#ringPath" textLength="286" lengthAdjust="spacing">
              ORORA ✦ BEAUTY CARE ✦ ORORA ✦ BEAUTY CARE ✦
            </textPath>
          </text>
        </svg>
        <b>✿</b>
      </div>

      <div className="hero-content">

        <p className="small-text">WELCOME TO</p>

        <h1 className="hero-title">
          <span className="hero-title-line">
            {"ORORA".split("").map((c, n) => (
              <span
                key={n}
                className="hero-letter"
                style={{ animationDelay: `${0.2 + n * 0.09}s` }}
              >
                {c}
              </span>
            ))}
          </span>
        </h1>

        <p className="description">Create something beautiful.</p>

        <p className="hero-rotator">
          Làn da{" "}
          <span className="rotator-box">
            <em key={i}>{WORDS[i]}</em>
          </span>{" "}
          mỗi ngày
        </p>

        <div className="hero-actions">
          <a href="#about" className="explore">
            Khám phá
            <span>↗</span>
          </a>
          <a href="#shop" className="explore-ghost">
            Xem sản phẩm
          </a>
        </div>

      </div>

      <div className="scroll">
        <span>SCROLL</span>
        <div />
      </div>

    </section>
  );
}

export default Hero;