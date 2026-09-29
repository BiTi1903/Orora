import { Reveal, CountUp } from "./Extras";

function About() {
  return (
    <section className="about" id="about">

      <div className="about-visual">
        <Reveal className="about-image-wrapper">
          <img src="/about.jpg" className="about-image" alt="About" />
        </Reveal>
        <div className="about-badge">
          <b>✿</b>
          <span>Nhẹ nhàng<br />cho làn da</span>
        </div>
      </div>

      <div className="about-content">
        <Reveal><p className="about-label">ABOUT</p></Reveal>

        <Reveal delay={80}>
          <h2>
            Something
            <br />
            <span>beautiful.</span>
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="about-text">
            A simple space to tell your story.
            Show your products, your style,
            and everything that makes your
            brand different.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="about-stats">
            <div><strong><CountUp to={5} suffix="+" /></strong><span>Sản phẩm</span></div>
            <div><strong><CountUp to={1000} suffix="+" /></strong><span>Khách hàng</span></div>
            <div><strong><CountUp to={98} suffix="%" /></strong><span>Hài lòng</span></div>
          </div>
        </Reveal>
      </div>

    </section>
  );
}

export default About;