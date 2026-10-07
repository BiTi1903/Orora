import { useEffect, useRef, useState } from "react";
import "../styles/extras.css";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";

/* ---------- Hook: hiện dần khi cuộn tới ---------- */

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );

    io.observe(el);

    return () => io.disconnect();
  }, [threshold]);

  return [ref, seen];
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}) {
  const [ref, seen] = useInView();

  return (
    <div
      ref={ref}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- Số đếm tăng dần ---------- */

export function CountUp({ to, suffix = "" }) {
  const [ref, seen] = useInView(0.5);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!seen) return;

    let raf;
    let start;

    const tick = (t) => {
      start ??= t;

      const p = Math.min(
        (t - start) / 1600,
        1
      );

      setN(
        Math.round(
          to * (1 - Math.pow(1 - p, 3))
        )
      );

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [seen, to]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

/* ---------- Hạt lấp lánh ---------- */

export function Sparkles() {
  const dots = Array.from(
    { length: 14 },
    (_, i) => ({
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 90}%`,
      size: 6 + ((i * 7) % 12),
      delay: `${(i % 7) * 0.6}s`,
      dur: `${4 + (i % 5)}s`,
    })
  );

  return (
    <div
      className="sparkles"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <i
          key={i}
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDelay: d.delay,
            animationDuration: d.dur,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Dải chữ chạy ---------- */

export function Marquee() {
  const c = useHomeContent();

  const words =
    c.marqueeWords?.length
      ? c.marqueeWords
      : [
          "Dịu nhẹ cho da",
          "Thành phần thuần khiết",
          "Không paraben",
          "Cấp ẩm sâu",
          "Rạng rỡ mỗi ngày",
        ];

  const row = words.map((w, i) => (
    <span key={`${w}-${i}`}>
      {w}
      <b>✦</b>
    </span>
  ));

  return (
    <div
      className="marquee"
      aria-hidden="true"
    >
      <div className="marquee-track">
        {row}
        {row}
        {row}
        {row}
      </div>
    </div>
  );
}

/* ---------- Lý do chọn / Nâng cấp bản thân ---------- */

export function Features({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const live = useHomeContent();
  const c = preview && previewData ? previewData : live || {};

  const features = c.features?.length ? c.features : [];
  const fs = c.featuresStyles || {};
  const css = (key) => toCss(fs[key], { responsive: !preview });

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const LabelWrap = preview ? "div" : Reveal;
  const TitleWrap = preview ? "div" : Reveal;

  return (
    <section
      className={`ex-section ${preview ? "ex-section--preview" : ""}`}
      id={preview ? undefined : "why"}
    >
      <LabelWrap>
        <p
          className={`ex-label ${selectedClass("featLabel")}`}
          data-builder-key={preview ? "featLabel" : undefined}
          onClick={select("featLabel")}
          style={css("label")}
        >
          {c.featuresLabel || "ORORA"}
        </p>
      </LabelWrap>

      <TitleWrap delay={80}>
        <h2
          className={`ex-title ${selectedClass("featTitle")}`}
          data-builder-key={preview ? "featTitle" : undefined}
          onClick={select("featTitle")}
          style={css("title")}
        >
          {c.featuresTitle || "Nâng cấp bản thân"}
        </h2>
      </TitleWrap>

      <div className="feature-grid">
        {features.map((f, i) => {
          const cardKey = `featCard-${i}`;
          const card = (
            <article
              className={`feature-card ${selectedClass(cardKey)}`}
              data-builder-key={preview ? cardKey : undefined}
              onClick={select(cardKey)}
            >
              <div
                className="feature-icon"
                style={css("icon")}
              >
                {f.icon}
              </div>

              <h3 style={css("cardTitle")}>{f.title}</h3>
              <p style={css("cardText")}>{f.text}</p>
            </article>
          );

          if (preview) {
            return <div key={`${f.title}-${i}`}>{card}</div>;
          }

          return (
            <Reveal key={`${f.title}-${i}`} delay={i * 110}>
              {card}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Câu chuyện + số liệu ---------- */

export function Story() {
  const c = useHomeContent();

  const stats =
    c.storyStats?.length
      ? c.storyStats
      : [];

  return (
    <section
      className="ex-section story"
      id="story"
    >
      <Reveal className="story-visual">
        <div className="arch">
          <span>✿</span>
        </div>

        <div className="arch arch-small" />
      </Reveal>

      <div className="story-text">
        <Reveal>
          <p className="ex-label">
            {c.storyLabel ||
              "CÂU CHUYỆN CỦA CHÚNG TÔI"}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="ex-title left">
            {c.storyTitle ||
              "Đẹp từ những điều"}{" "}
            <em>
              {c.storyHighlight ||
                "giản dị"}
            </em>
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="story-p">
            {c.storyText}
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="stats">
            {stats.map((item, i) => (
              <div key={i}>
                <strong>
                  <CountUp
                    to={Number(item.value) || 0}
                    suffix={item.suffix || ""}
                  />
                </strong>

                <span>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Quy trình ---------- */

export function Ritual() {
  const c = useHomeContent();

  const steps =
    c.steps?.length
      ? c.steps
      : [];

  return (
    <section className="ex-section ritual">
      <Reveal>
        <p className="ex-label">
          {c.ritualLabel ||
            "QUY TRÌNH ĐƠN GIẢN"}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <h2 className="ex-title">
          {c.ritualTitle ||
            "3 bước cho làn da"}{" "}
          <em>
            {c.ritualHighlight ||
              "rạng rỡ"}
          </em>
        </h2>
      </Reveal>

      <div className="steps">
        {steps.map((s, i) => (
          <Reveal
            key={`${s.n}-${i}`}
            delay={i * 130}
          >
            <div className="step">
              <span className="step-n">
                {s.n}
              </span>

              <h3>{s.t}</h3>

              <p>{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Cảm nhận ---------- */

export function Testimonials({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const live = useHomeContent();
  const c = preview && previewData ? previewData : live || {};

  const reviews = c.reviews?.length ? c.reviews : [];
  const ts = c.testimonialsStyles || {};

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const LabelWrap = preview ? "div" : Reveal;
  const TitleWrap = preview ? "div" : Reveal;
  const css = (key) => toCss(ts[key], { responsive: !preview });

  return (
    <section
      className={`ex-section ${preview ? "ex-section--preview" : ""}`}
    >
      <LabelWrap>
        <p
          className={`ex-label ${selectedClass("revLabel")}`}
          data-builder-key={preview ? "revLabel" : undefined}
          onClick={select("revLabel")}
          style={css("label")}
        >
          {c.testimonialsLabel || "CẢM NHẬN"}
        </p>
      </LabelWrap>

      <TitleWrap delay={80}>
        <h2 className="ex-title">
          <span
            className={selectedClass("revTitle")}
            data-builder-key={preview ? "revTitle" : undefined}
            onClick={select("revTitle")}
            style={css("title")}
          >
            {c.testimonialsTitle || "Được"}
          </span>{" "}
          <em
            className={selectedClass("revHighlight")}
            data-builder-key={preview ? "revHighlight" : undefined}
            onClick={select("revHighlight")}
            style={css("highlight")}
          >
            {c.testimonialsHighlight || "yêu thích"}
          </em>{" "}
          <span
            className={selectedClass("revTitleEnd")}
            data-builder-key={preview ? "revTitleEnd" : undefined}
            onClick={select("revTitleEnd")}
            style={css("titleEnd")}
          >
            {c.testimonialsTitleEnd || "bởi những cô nàng như bạn"}
          </span>
        </h2>
      </TitleWrap>

      <div className="review-grid">
        {reviews.map((r, i) => {
          const cardKey = `revCard-${i}`;
          const card = (
            <blockquote
              className={`review ${selectedClass(cardKey)}`}
              data-builder-key={preview ? cardKey : undefined}
              onClick={select(cardKey)}
            >
              <div className="stars">★★★★★</div>

              <p style={css("reviewText")}>“{r.text}”</p>

              <div className="review-author">
                {r.image ? (
                  <img
                    className="review-avatar"
                    src={r.image}
                    alt={r.name || "Khách hàng"}
                  />
                ) : (
                  <span className="review-avatar review-avatar--placeholder">
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <cite style={css("reviewName")}>{r.name}</cite>
              </div>
            </blockquote>
          );

          if (preview) {
            return <div key={`${r.name}-${i}`}>{card}</div>;
          }

          return (
            <Reveal key={`${r.name}-${i}`} delay={i * 110}>
              {card}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Đăng ký nhận tin ---------- */

export function Newsletter() {
  const c = useHomeContent();
  const [done, setDone] = useState(false);

  return (
    <section className="newsletter">
      <Reveal>
        <h2 className="ex-title">
          {c.newsletterTitle ||
            "Nhận ưu đãi"}{" "}
          <em>
            {c.newsletterHighlight ||
              "ngay"}
          </em>
        </h2>

        <p className="newsletter-p">
          {c.newsletterText ||
            "Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn."}
        </p>

        <form
          className="news-form"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <input
            type="email"
            required
            placeholder="Email của bạn"
            aria-label="Email"
          />

          <button type="submit">
            {done
              ? "Cảm ơn bạn ♡"
              : "Đăng ký"}
          </button>
        </form>
      </Reveal>
    </section>
  );
}

/* ---------- Footer ---------- */

export function Footer() {
  const c = useHomeContent();

  return (
    <footer className="footer">
      <div className="footer-logo">
        {c.footerLogo || "ORORA"}
      </div>

      <p>
        {c.footerDescription ||
          "Chăm sóc làn da, nuôi dưỡng sự tự tin."}
      </p>

      <div className="footer-links">
        <a
          href={c.footerInstagram || "#"}
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>

        <a
          href={c.footerFacebook || "#"}
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>

        <a
          href={c.footerTikTok || "#"}
          target="_blank"
          rel="noreferrer"
        >
          TikTok
        </a>
      </div>

      <small>
        {c.footerCopyright ||
          "© 2026 ORORA. All rights reserved."}
      </small>
    </footer>
  );
}