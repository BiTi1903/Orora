import { useEffect, useState } from "react";
import { Sparkles } from "./Extras";
import useHomeContent from "../hooks/useHomeContent";

function Hero({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const live = useHomeContent();
  const c = preview && previewData ? previewData : live;

  const words =
    c.heroRotator && c.heroRotator.length
      ? c.heroRotator
      : ["dịu nhẹ"];

  const [i, setI] = useState(0);

  useEffect(() => {
    if (preview) return;

    const t = setInterval(
      () => setI((v) => (v + 1) % words.length),
      2400
    );

    return () => clearInterval(t);
  }, [words.length, preview]);

  const handleMove = (e) => {
    if (preview) return;
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
    if (preview) return;
    e.currentTarget.style.setProperty("--px", 0);
    e.currentTarget.style.setProperty("--py", 0);
  };

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const previewWord = words[0] || "dịu nhẹ";

  return (
    <section
      className={`hero ${preview ? "hero--preview" : ""}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={preview ? select("image") : undefined}
      data-builder-key={preview ? "image" : undefined}
      style={
        c.heroImage
          ? { backgroundImage: `url("${c.heroImage}")` }
          : undefined
      }
    >
      {!preview && <Sparkles />}

      {/* =========================
          THẺ KÍNH NỔI
      ========================= */}
      <div
        className={`hero-chip chip-1 ${selectedClass("chip1")}`}
        style={{ "--d": 40 }}
        data-builder-key={preview ? "chip1" : undefined}
        onClick={select("chip1")}
      >
        <span className="chip-in">
          <b>✦</b> {c.heroChip1 || "Dịu nhẹ cho da"}
        </span>
      </div>

      <div
        className={`hero-chip chip-2 ${selectedClass("chip2")}`}
        style={{ "--d": -55 }}
        data-builder-key={preview ? "chip2" : undefined}
        onClick={select("chip2")}
      >
        <span className="chip-in">
          <b>♡</b> {c.heroChip2 || "Thành phần thuần khiết"}
        </span>
      </div>

      <div
        className={`hero-chip chip-3 ${selectedClass("chip3")}`}
        style={{ "--d": 30 }}
        data-builder-key={preview ? "chip3" : undefined}
        onClick={select("chip3")}
      >
        <span className="chip-in">
          <b>✧</b> {c.heroChip3 || "Cấp ẩm sâu"}
        </span>
      </div>

      {/* =========================
          VÒNG CHỮ XOAY
      ========================= */}
      <a
        href={preview ? undefined : "#shop"}
        className={`hero-ring ${selectedClass("ring")}`}
        aria-label="Xem sản phẩm"
        data-builder-key={preview ? "ring" : undefined}
        onClick={select("ring")}
      >
        <svg viewBox="0 0 120 120">
          <defs>
            <path
              id={preview ? "ringPathPreview" : "ringPath"}
              d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            />
          </defs>

          <text>
            <textPath href={preview ? "#ringPathPreview" : "#ringPath"}>
              {c.heroRingText || "ORORA ✦ SẢN PHẨM ✦ ORORA ✦"}
            </textPath>
          </text>
        </svg>

        <b>✿</b>
      </a>

      {/* =========================
          NỘI DUNG HERO
      ========================= */}
      <div className="hero-content" onClick={(e) => e.stopPropagation()}>
        <p
          className={`small-text ${selectedClass("eyebrow")}`}
          data-builder-key={preview ? "eyebrow" : undefined}
          onClick={select("eyebrow")}
        >
          {c.heroEyebrow}
        </p>

        <h1
          className={`hero-title ${selectedClass("title")}`}
          key={c.heroTitle}
          data-builder-key={preview ? "title" : undefined}
          onClick={select("title")}
        >
          <span className="hero-title-line">
            {Array.from(c.heroTitle || "").map((ch, n) => (
              <span
                key={n}
                className="hero-letter"
                style={{
                  "--letter-delay": preview ? "0s" : `${0.2 + n * 0.09}s`,
                }}
              >
                {ch}
              </span>
            ))}
          </span>
        </h1>

        <p
          className={`description ${selectedClass("description")}`}
          data-builder-key={preview ? "description" : undefined}
          onClick={select("description")}
        >
          {c.heroDescription}
        </p>

        <p
          className={`hero-rotator ${selectedClass("rotator")}`}
          data-builder-key={preview ? "rotator" : undefined}
          onClick={select("rotator")}
        >
          Làn da{" "}
          <span className="rotator-box">
            <em key={preview ? previewWord : i}>
              {preview ? previewWord : words[i % words.length]}
            </em>
          </span>{" "}
          mỗi ngày
        </p>

        {/* =========================
            BUTTONS
        ========================= */}
        <div className="hero-actions">
          <a
            href={preview ? undefined : c.heroButtonLink || "#about"}
            className={`hero-btn hero-btn-primary ${selectedClass("btnPrimary")}`}
            data-builder-key={preview ? "btnPrimary" : undefined}
            onClick={select("btnPrimary")}
          >
            {c.heroButtonText}
            <span>↗</span>
          </a>

          <a
            href={preview ? undefined : c.shopButtonLink || "#shop"}
            className={`hero-btn hero-btn-ghost ${selectedClass("btnSecondary")}`}
            data-builder-key={preview ? "btnSecondary" : undefined}
            onClick={select("btnSecondary")}
          >
            {c.shopButtonText}
          </a>
        </div>
      </div>

      {/* =========================
          CUỘN
      ========================= */}
      <div
        className={`scroll ${selectedClass("scroll")}`}
        data-builder-key={preview ? "scroll" : undefined}
        onClick={select("scroll")}
      >
        <span>{c.heroScrollText || "CUỘN"}</span>
        <div />
      </div>
    </section>
  );
}

export default Hero;