import { useEffect, useState } from "react";
import { Reveal, CountUp } from "./Extras";
import { getHomeContent } from "../lib/api";

function About() {
  const [home, setHome] = useState(null);

  useEffect(() => {
    getHomeContent()
      .then((data) => {
        if (data) {
          setHome(data);
        }
      })
      .catch((err) => {
        console.error("Không thể tải nội dung Story:", err);
      });
  }, []);

  const storyLabel = home?.storyLabel || "ABOUT";
  const storyTitle = home?.storyTitle || "Something";
  const storyHighlight = home?.storyHighlight || "beautiful.";

  const storyText =
    home?.storyText ||
    "A simple space to tell your story. Show your products, your style, and everything that makes your brand different.";

  const storyImage = home?.storyImage || "/about.jpg";

  const storyStats = home?.storyStats?.length
    ? home.storyStats
    : [
        { value: 5, suffix: "+", label: "Sản phẩm" },
        { value: 1000, suffix: "+", label: "Khách hàng" },
        { value: 98, suffix: "%", label: "Hài lòng" },
      ];

  return (
    <section className="about" id="about">
      <div className="about-visual">
        <Reveal className="about-image-wrapper">
          <img
            src={storyImage}
            className="about-image"
            alt="About"
          />
        </Reveal>

        {/* <div className="about-badge">
          <b>✿</b>
          <span>
            Nhẹ nhàng
            <br />
            cho làn da
          </span>
        </div> */}
      </div>

      <div className="about-content">
        <Reveal>
          <p className="about-label">{storyLabel}</p>
        </Reveal>

        <Reveal delay={80}>
          <h2>
            {storyTitle}
            <br />
            <span>{storyHighlight}</span>
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="about-text">
            {storyText}
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="about-stats">
            {storyStats.map((item, index) => (
              <div key={index}>
                <strong>
                  <CountUp
                    to={Number(item.value) || 0}
                    suffix={item.suffix || ""}
                  />
                </strong>

                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default About;