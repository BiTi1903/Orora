import {reviewCardStyle} from '../lib/review-card-style';
import {cdnSrc} from "../lib/image-cdn";
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

  const words = Array.isArray(c.marqueeWords) ? c.marqueeWords : [];

  const ms = c.marqueeStyles || {};
  const textStyle = toCss(ms.text);
  const starStyle = toCss(ms.star);
  const bg = ms.background || ms.band?.color;
  const bandStyle = bg ? { background: bg } : undefined;

  if ((c.loading && !c.shellReady) || !words.length) return null;

  const row = words.map((w, i) => (
    <span key={`${w}-${i}`} style={textStyle}>
      {w}
      <b style={starStyle}>✦</b>
    </span>
  ));

  return (
    <div
      className="marquee"
      style={bandStyle}
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
  const css = (key) => toCss(fs[key], { responsive: true });

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
          {c.featuresLabel}
        </p>
      </LabelWrap>

      <TitleWrap delay={80}>
        <h2
          className={`ex-title ${selectedClass("featTitle")}`}
          data-builder-key={preview ? "featTitle" : undefined}
          onClick={select("featTitle")}
          style={css("title")}
        >
          {c.featuresTitle}
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
            {c.storyLabel}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="ex-title left">
            {c.storyTitle}{" "}
            <em>
              {c.storyHighlight}
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
          {c.ritualLabel}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <h2 className="ex-title">
          {c.ritualTitle}{" "}
          <em>
            {c.ritualHighlight}
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
  const css = (key) => toCss(ts[key], { responsive: true });

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
          {c.testimonialsLabel}
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
            {c.testimonialsTitle}
          </span>{" "}
          <em
            className={selectedClass("revHighlight")}
            data-builder-key={preview ? "revHighlight" : undefined}
            onClick={select("revHighlight")}
            style={css("highlight")}
          >
            {c.testimonialsHighlight}
          </em>{" "}
          <span
            className={selectedClass("revTitleEnd")}
            data-builder-key={preview ? "revTitleEnd" : undefined}
            onClick={select("revTitleEnd")}
            style={css("titleEnd")}
          >
            {c.testimonialsTitleEnd}
          </span>
        </h2>
      </TitleWrap>

      <div className="review-grid">
        {reviews.map((r, i) => {
          const cardKey = `revCard-${i}`;
          const card = (
            <blockquote
              className={`review ${selectedClass(cardKey)}`}
              style={reviewCardStyle(ts.card)}
              data-builder-key={preview ? cardKey : undefined}
              onClick={select(cardKey)}
            >
              <div className="stars">★★★★★</div>

              <p style={css("reviewText")}>“{r.text}”</p>

              <div className="review-author">
                {r.image ? (
                  <img
                    className="review-avatar"
                    src={cdnSrc(r.image,{w:96,q:"auto:good"})}
                    loading="lazy" decoding="async" width="40" height="40"
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

export function Newsletter({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const live = useHomeContent();
  const c = preview && previewData ? previewData : live || {};
  const styles = c.newsletterStyles || {};
  const [submission, setSubmission] = useState({ busy: false, ok: false, message: "" });

  const subscribe = async (event) => {
    event.preventDefault();
    if (preview || submission.busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSubmission({ busy: true, ok: false, message: "" });
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fields.get("email"), consent: fields.get("consent") === "on" }),
      });
      const result = await response.json();
      setSubmission({ busy: false, ok: response.ok, message: result.message || "Chưa thực hiện được. Vui lòng thử lại." });
      if (response.ok) form.reset();
    } catch {
      setSubmission({ busy: false, ok: false, message: "Chưa kết nối được máy chủ. Vui lòng thử lại sau." });
    }
  };

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const css = (key) => ({ ...toCss(styles[key], { responsive: true }), ...(styles[key]?.background ? { background: styles[key].background } : {}), ...(styles[key]?.borderColor ? { borderColor: styles[key].borderColor } : {}), ...(styles[key]?.borderRadius != null && styles[key].borderRadius !== "" ? { borderRadius: `${Number(styles[key].borderRadius)}px` } : {}) });

  const Content = (
    <>
      <h2 className="ex-title">
        <span
          className={selectedClass("nlTitle")}
          data-builder-key={preview ? "nlTitle" : undefined}
          onClick={select("nlTitle")}
          style={css("title")}
        >
          {c.newsletterTitle}{" "}
        </span>
        <em
          className={selectedClass("nlHighlight")}
          data-builder-key={preview ? "nlHighlight" : undefined}
          onClick={select("nlHighlight")}
          style={css("highlight")}
        >
          {c.newsletterHighlight}
        </em>
      </h2>

      <p
        className={`newsletter-p ${selectedClass("nlText")}`}
        data-builder-key={preview ? "nlText" : undefined}
        onClick={select("nlText")}
        style={css("text")}
      >
        {c.newsletterText}
      </p>

      <form
        className="news-form"
        aria-busy={!preview && submission.busy}
        onSubmit={subscribe}
      >
        <div className="news-form-row">
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required={!preview}
            placeholder={c.newsletterPlaceholder || "Email của bạn"}
            aria-label="Email"
            className={selectedClass("nlPlaceholder")}
            data-builder-key={preview ? "nlPlaceholder" : undefined}
            onClick={select("nlPlaceholder")}
            style={css("input")}
            readOnly={preview}
          />

          <button
            type="submit"
            disabled={!preview && submission.busy}
            aria-busy={!preview && submission.busy}
            className={selectedClass("nlButton")}
            data-builder-key={preview ? "nlButton" : undefined}
            onClick={select("nlButton")}
            style={css("button")}
          >
            {submission.busy ? "Đang lưu email…" : c.newsletterButton || "Đăng ký"}
          </button>
        </div>
        {
            <label className={`newsletter-consent ${selectedClass("nlConsent")}`} data-builder-key={preview ? "nlConsent" : undefined} onClick={select("nlConsent")} style={css("consent")}>
              <input type="checkbox" name="consent" required={!preview} disabled={preview} />
              <span>{c.newsletterConsent ?? "Tôi đồng ý nhận email về sản phẩm và ưu đãi từ ORORA. Có thể hủy đăng ký bất cứ lúc nào."}</span>
            </label>
        }
      </form>
      {!preview && submission.message && (
        <p role="status" className={`newsletter-result ${submission.ok ? "success" : "error"}`}>{submission.message}</p>
      )}
    </>
  );

  return (
    <section
      id={preview ? undefined : "newsletter"}
      className={`newsletter ${preview ? "newsletter--preview" : ""}`}
    >
      {preview ? Content : <Reveal>{Content}</Reveal>}
    </section>
  );
}

/* ---------- Footer ---------- */

export function Footer() {
  const c = useHomeContent();

  return (
    <footer className="footer">
      <div className="footer-logo">
        {c.footerLogo}
      </div>

      <p>
        {c.footerDescription}
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
        {c.footerCopyright}
      </small>
    </footer>
  );
}