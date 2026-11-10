import {heroImageSources} from "../lib/image-cdn";
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

  const words = Array.isArray(c.heroRotator) ? c.heroRotator : [];
  const cards = Array.isArray(c.heroGlassCards) ? c.heroGlassCards.filter((card) => card && typeof card.text === "string" && card.text.trim()) : [];

  const [i, setI] = useState(0);

  useEffect(() => {
    if (preview || words.length < 2) return;

    const t = setInterval(
      () => setI((v) => (v + 1) % words.length),
      2400
    );

    return () => clearInterval(t);
  }, [words.length, preview]);

  const handleMove = (e) => {
    if (preview) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;

    el.style.setProperty(
      "--px",
      Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5)).toFixed(3)
    );

    el.style.setProperty(
      "--py",
      Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5)).toFixed(3)
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

  const previewWord = words[0] || "";

  // Chỉ gắn ảnh nền khi đã có URL thật từ admin/Firestore.
  // Khi đang loading (chưa có snapshot) → giữ nền gradient CSS, không load /hero.jpg cũ.
  const ready = preview || c.loading === false || c.shellReady === true;
  const sources=heroImageSources(c);
  const imageUrl=ready?sources.desktop:null;
  const imageMobileUrl=ready?sources.mobile:null;

  // Preload đúng ảnh sẽ hiển thị (điện thoại chỉ tải ảnh mobile, không tải ảnh desktop)
  useEffect(() => {
    if (preview) return;
    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    const src = (isMobile && imageMobileUrl) || imageUrl;
    if (!src) return;
    const img = new Image();
    img.fetchPriority="high";
    img.src = src;
  }, [imageUrl, imageMobileUrl, preview]);

  // Ảnh nền đi qua biến CSS để hero.css chọn ảnh theo bề rộng màn hình
  const heroBgVars = {};
  if (imageUrl) heroBgVars["--hero-bg"] = `url("${imageUrl}")`;
  if (imageMobileUrl) heroBgVars["--hero-bg-mobile"] = `url("${imageMobileUrl}")`;

  return (
    <section
      className={`hero ${preview ? "hero--preview" : ""}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={preview ? select("image") : undefined}
      data-builder-key={preview ? "image" : undefined}
            style={Object.keys(heroBgVars).length ? heroBgVars : undefined}
    >
      {!preview && <Sparkles />}

      {ready && <>
      {/* =========================
          THẺ KÍNH NỔI
      ========================= */}
      {(typeof c.heroChip1 === "string" && c.heroChip1.trim()) && <div
        className={`hero-chip chip-1 ${selectedClass("chip1")}`}
        style={{ "--d": 40 }}
        data-builder-key={preview ? "chip1" : undefined}
        onClick={select("chip1")}
      >
        <span className="chip-in">
          <b>✦</b> {c.heroChip1}
        </span>
      </div>}

      {(typeof c.heroChip2 === "string" && c.heroChip2.trim()) && <div
        className={`hero-chip chip-2 ${selectedClass("chip2")}`}
        style={{ "--d": -55 }}
        data-builder-key={preview ? "chip2" : undefined}
        onClick={select("chip2")}
      >
        <span className="chip-in">
          <b>♡</b> {c.heroChip2}
        </span>
      </div>}

      {(typeof c.heroChip3 === "string" && c.heroChip3.trim()) && <div
        className={`hero-chip chip-3 ${selectedClass("chip3")}`}
        style={{ "--d": 30 }}
        data-builder-key={preview ? "chip3" : undefined}
        onClick={select("chip3")}
      >
        <span className="chip-in">
          <b>✧</b> {c.heroChip3}
        </span>
      </div>}

      {cards.map((card, index) => <div key={card.id || index} className="hero-chip hero-chip-custom" style={{ "--d": 20, left: `clamp(140px, ${Number.isFinite(card.x) ? Math.max(0, Math.min(100, card.x)) : 50}%, calc(100% - 140px))`, top: `clamp(40px, ${Number.isFinite(card.y) ? Math.max(0, Math.min(100, card.y)) : 50}%, calc(100% - 40px))` }} onClick={select("image")}><span className="chip-in">{card.text}</span></div>)}

      {/* =========================
          VÒNG CHỮ XOAY
      ========================= */}
      {(preview || c.heroRingText) && <a
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
              {c.heroRingText}
            </textPath>
          </text>
        </svg>

        <b>✿</b>
      </a>}

      {/* =========================
          NỘI DUNG HERO
      ========================= */}
      <div className="hero-content" onClick={(e) => e.stopPropagation()}>
        {typeof c.heroEyebrow === "string" && c.heroEyebrow.trim() && <p
          className={`small-text ${selectedClass("eyebrow")}`}
          data-builder-key={preview ? "eyebrow" : undefined}
          onClick={select("eyebrow")}
        >
          {c.heroEyebrow}
        </p>}

        <h1
          className={`hero-title ${selectedClass("title")}`}
          aria-label={c.heroTitle || undefined}
          key={c.heroTitle}
          data-builder-key={preview ? "title" : undefined}
          onClick={select("title")}
        >
          <span className="hero-title-line" aria-hidden="true">
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

        {(preview || words.length > 0) && <p
          className={`hero-rotator ${selectedClass("rotator")}`}
          data-builder-key={preview ? "rotator" : undefined}
          onClick={select("rotator")}
        >
          {c.heroRotatorPrefix ?? "Làn da"}{" "}
          <span className="rotator-box">
            <em key={preview ? previewWord : i}>
              {preview ? previewWord : words[i % words.length]}
            </em>
          </span>{" "}
          {c.heroRotatorSuffix ?? "mỗi ngày"}
        </p>}

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
      {(preview || c.heroScrollText) && <div
        className={`scroll ${selectedClass("scroll")}`}
        data-builder-key={preview ? "scroll" : undefined}
        onClick={select("scroll")}
      >
        <span>{c.heroScrollText}</span>
        <div />
      </div>}
      </>}
    </section>
  );
}

export default Hero;
