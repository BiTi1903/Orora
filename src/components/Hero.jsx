   import { Sparkles } from "./Extras";
function Hero() {
  return (
    <section className="hero">
     <Sparkles />
      <div className="hero-content">

        <p className="small-text">
          WELCOME TO
        </p>

        <h1 className="hero-title">

          <span className="hero-title-line">
            ORORA
          </span>

        </h1>

        <p className="description">
          Create something beautiful.
        </p>

        <a
          href="#about"
          className="explore"
        >
          Khám phá
          <span>
            ↗
          </span>
        </a>

      </div>

      <div className="scroll">

        <span>
          SCROLL
        </span>

        <div />

      </div>

    </section>
  );
}

export default Hero;