function About() {
  return (
    <section
      className="about"
      id="about"
    >

      <div className="about-image-wrapper">

        <img
          src="/about.jpg"
          className="about-image"
          alt="About"
        />

      </div>

      <div className="about-content">

        <p className="about-label">
          ABOUT
        </p>

        <h2>
          Something
          <br />
          <span>
            beautiful.
          </span>
        </h2>

        <p className="about-text">
          A simple space to tell your story.
          Show your products, your style,
          and everything that makes your
          brand different.
        </p>



      </div>

    </section>
  );
}

export default About;