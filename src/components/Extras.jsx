import { useEffect, useRef, useState } from "react";
import "../styles/extras.css";
import useHomeContent from "../hooks/useHomeContent";

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

/* ---------- Lý do chọn ---------- */

export function Features() {
  const c = useHomeContent();

  const features =
    c.features?.length
      ? c.features
      : [];

  return (
    <section
      className="ex-section"
      id="why"
    >
      <Reveal>
        <p className="ex-label">
          {c.featuresLabel || "ORORA"}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <h2 className="ex-title">
          {c.featuresTitle ||
            "Nâng cấp bản thân"}
        </h2>
      </Reveal>

      <div className="feature-grid">
        {features.map((f, i) => (
          <Reveal
            key={`${f.title}-${i}`}
            delay={i * 110}
          >
            <article className="feature-card">
              <div className="feature-icon">
                {f.icon}
              </div>

              <h3>{f.title}</h3>

              <p>{f.text}</p>
            </article>
          </Reveal>
        ))}
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

export function Testimonials() {
  const c = useHomeContent();

  const reviews =
    c.reviews?.length
      ? c.reviews
      : [];

  return (
    <section className="ex-section">
      <Reveal>
        <p className="ex-label">
          {c.testimonialsLabel ||
            "CẢM NHẬN"}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <h2 className="ex-title">
          {c.testimonialsTitle ||
            "Được"}{" "}
          <em>
            {c.testimonialsHighlight ||
              "yêu thích"}
          </em>{" "}
          {c.testimonialsTitleEnd ||
            "bởi những cô nàng như bạn"}
        </h2>
      </Reveal>

      <div className="review-grid">
        {reviews.map((r, i) => (
          <Reveal
            key={`${r.name}-${i}`}
            delay={i * 110}
          >
            <blockquote className="review">
              <div className="stars">
                ★★★★★
              </div>

              <p>“{r.text}”</p>

              <cite>{r.name}</cite>
            </blockquote>
          </Reveal>
        ))}
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