import { useEffect, useState } from "react";
import { Sparkles } from "./Extras";
import useHomeContent from "../hooks/useHomeContent";

function Hero() {
  const c = useHomeContent();
  const words =
    c.heroRotator && c.heroRotator.length ? c.heroRotator : ["dịu nhẹ"];

  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setI((v) => (v + 1) % words.length),
      2400
    );

    return () => clearInterval(t);
  }, [words.length]);

  const handleMove = (e) => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const el = e.currentTarget;
    const r = el.getBoundingClientRect();

    el.style.setProperty(
      "--px",
      ((e.clientX - r.left) / r.width - 0.5).toFixed(3)
    );

    el.style.setProperty(
      "--py",
      ((e.clientY - r.top) / r.height - 0.5).toFixed(3)
    );
  };

  const handleLeave = (e) => {
    e.currentTarget.style.setProperty("--px", 0);
    e.currentTarget.style.setProperty("--py", 0);
  };

  return (
    <section
      className="hero"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        c.heroImage
          ? { backgroundImage: `url("${c.heroImage}")` }
          : undefined
      }
    >
      <Sparkles />

      {/* thẻ kính nổi */}
      <div className="hero-chip chip-1" style={{ "--d": 40 }}>
        <span className="chip-in">
          <b>✦</b> Dịu nhẹ cho da
        </span>
      </div>

      <div className="hero-chip chip-2" style={{ "--d": -55 }}>
        <span className="chip-in">
          <b>♡</b> Thành phần thuần khiết
        </span>
      </div>

      <div className="hero-chip chip-3" style={{ "--d": 30 }}>
        <span className="chip-in">
          <b>✧</b> Cấp ẩm sâu
        </span>
      </div>

      {/* vòng chữ xoay - click để tới sản phẩm */}
      <a
        href="#shop"
        className="hero-ring"
        aria-label="Xem sản phẩm"
      >
        <svg viewBox="0 0 120 120">
          <defs>
            <path
              id="ringPath"
              d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            />
          </defs>

          <text>
            <textPath
              href="#ringPath"
              textLength="286"
              lengthAdjust="spacing"
            >
              ORORA ✦ SẢN PHẨM ✦ ORORA ✦
            </textPath>
          </text>
        </svg>

        <b>✿</b>
      </a>

      <div className="hero-content">
        <p className="small-text">{c.heroEyebrow}</p>

        <h1 className="hero-title" key={c.heroTitle}>
          <span className="hero-title-line">
            {Array.from(c.heroTitle || "").map((ch, n) => (
              <span
                key={n}
                className="hero-letter"
                style={{ "--letter-delay": `${0.2 + n * 0.09}s` }}
              >
                {ch}
              </span>
            ))}
          </span>
        </h1>

        <p className="description">{c.heroDescription}</p>

        <p className="hero-rotator">
          Làn da{" "}
          <span className="rotator-box">
            <em key={i}>{words[i % words.length]}</em>
          </span>{" "}
          mỗi ngày
        </p>

        <div className="hero-actions">
          <a
            href={c.heroButtonLink || "#about"}
            className="hero-btn hero-btn-primary"
          >
            {c.heroButtonText}
            <span>↗</span>
          </a>

          <a
            href={c.shopButtonLink || "#shop"}
            className="hero-btn hero-btn-ghost"
          >
            {c.shopButtonText}
          </a>
        </div>
      </div>

      <div className="scroll">
        <span>CUỘN</span>
        <div />
      </div>
    </section>
  );
}

export default Hero;