import { useEffect, useRef, useState } from "react";
   import "../styles/extras.css";
/* ---------- Hook: hiện dần khi cuộn tới ---------- */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}

export function Reveal({ children, delay = 0, className = "" }) {
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
    let raf, start;
    const tick = (t) => {
      start ??= t;
      const p = Math.min((t - start) / 1600, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

/* ---------- Hạt lấp lánh: đặt bên trong <section className="hero"> ---------- */
export function Sparkles() {
  const dots = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 90}%`,
    size: 6 + ((i * 7) % 12),
    delay: `${(i % 7) * 0.6}s`,
    dur: `${4 + (i % 5)}s`,
  }));
  return (
    <div className="sparkles" aria-hidden="true">
      {dots.map((d, i) => (
        <i key={i} style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.dur }} />
      ))}
    </div>
  );
}

/* ---------- Dải chữ chạy ---------- */
const WORDS = ["Dịu nhẹ cho da", "Thành phần thuần khiết", "Không paraben", "Cấp ẩm sâu", "Rạng rỡ mỗi ngày"];
export function Marquee() {
  const row = WORDS.map((w) => <span key={w}>{w}<b>✦</b></span>);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{row}{row}{row}{row}</div>
    </div>
  );
}

/* ---------- Lý do chọn ---------- */
const FEATURES = [
  { icon: "❀", title: "Thành phần lành tính", text: "Công thức ưu tiên chiết xuất thiên nhiên, phù hợp cả làn da nhạy cảm." },
  { icon: "☾", title: "Cấp ẩm suốt ngày dài", text: "Thấm nhanh, không bết dính, để da mềm mượt từ sáng đến tối." },
  { icon: "✧", title: "Hương thơm thanh tao", text: "Mùi hương nhẹ nhàng như một khoảnh khắc thư giãn cho riêng bạn." },
  { icon: "♡", title: "Đóng gói tinh tế", text: "Thiết kế xinh xắn, làm quà tặng cho chính mình hay người thương đều đẹp." },
];
export function Features() {
  return (
    <section className="ex-section" id="why">
      <Reveal><p className="ex-label">ORORA</p></Reveal>
      <Reveal delay={80}>
        <h2 className="ex-title">Nâng cấp bản thân</h2>
      </Reveal>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 110}>
            <article className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Câu chuyện + số liệu (SỬA SỐ THẬT CỦA BẠN) ---------- */
export function Story() {
  return (
    <section className="ex-section story" id="story">
      <Reveal className="story-visual">
        <div className="arch"><span>✿</span></div>
        <div className="arch arch-small" />
      </Reveal>
      <div className="story-text">
        <Reveal><p className="ex-label">CÂU CHUYỆN CỦA CHÚNG TÔI</p></Reveal>
        <Reveal delay={80}>
          <h2 className="ex-title left">Đẹp từ những điều <em>giản dị</em></h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="story-p">
            Chúng tôi bắt đầu từ mong muốn nhỏ: chọn lọc vài sản phẩm chăm sóc da thật sự
            hiệu quả, an toàn và dễ dùng mỗi ngày. Không quá nhiều bước, chỉ những điều cần thiết
            để bạn tự tin với làn da của mình.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="stats">
            <div><strong><CountUp to={5} suffix="+" /></strong><span>Sản phẩm chọn lọc</span></div>
            <div><strong><CountUp to={1000} suffix="+" /></strong><span>Khách hàng yêu thích</span></div>
            <div><strong><CountUp to={98} suffix="%" /></strong><span>Hài lòng</span></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Quy trình ---------- */
const STEPS = [
  { n: "01", t: "Làm sạch", d: "Loại bỏ bụi bẩn và dầu thừa nhẹ nhàng." },
  { n: "02", t: "Dưỡng ẩm", d: "Nuôi dưỡng da căng mọng, mềm mại." },
  { n: "03", t: "Bảo vệ", d: "Giữ làn da khỏe trước tác động môi trường." },
];
export function Ritual() {
  return (
    <section className="ex-section ritual">
      <Reveal><p className="ex-label">QUY TRÌNH ĐƠN GIẢN</p></Reveal>
      <Reveal delay={80}><h2 className="ex-title">3 bước cho làn da <em>rạng rỡ</em></h2></Reveal>
      <div className="steps">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 130}>
            <div className="step">
              <span className="step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Cảm nhận (THAY BẰNG ĐÁNH GIÁ THẬT) ---------- */
const REVIEWS = [
  { name: "Khách hàng A", text: "Da mình mềm và dịu hơn hẳn sau vài tuần dùng. Mùi hương rất dễ chịu." },
  { name: "Khách hàng B", text: "Bao bì xinh, dùng lên không bết dính. Mình đã mua tặng bạn thân." },
  { name: "Khách hàng C", text: "Sản phẩm nhẹ nhàng, phù hợp da nhạy cảm như mình." },
];
export function Testimonials() {
  return (
    <section className="ex-section">
      <Reveal><p className="ex-label">CẢM NHẬN</p></Reveal>
      <Reveal delay={80}><h2 className="ex-title">Được <em>yêu thích</em> bởi những cô nàng như bạn</h2></Reveal>
      <div className="review-grid">
        {REVIEWS.map((r, i) => (
          <Reveal key={r.name} delay={i * 110}>
            <blockquote className="review">
              <div className="stars">★★★★★</div>
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
  const [done, setDone] = useState(false);
  return (
    <section className="newsletter">
      <Reveal>
        <h2 className="ex-title">Nhận ưu đãi <em>ngay</em></h2>
        <p className="newsletter-p">Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn.</p>
        <form className="news-form" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
          <input type="email" required placeholder="Email của bạn" aria-label="Email" />
          <button type="submit">{done ? "Cảm ơn bạn ♡" : "Đăng ký"}</button>
        </form>
      </Reveal>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">Your<span>Brand</span></div>
      <p>Chăm sóc làn da, nuôi dưỡng sự tự tin.</p>
      <div className="footer-links">
        <a href="#">Instagram</a><a href="#">Facebook</a><a href="#">TikTok</a>
      </div>
      <small>© 2026 YourBrand. All rights reserved.</small>
    </footer>
  );
}