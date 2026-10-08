import { useEffect, useState } from "react";
import { Reveal, CountUp } from "./Extras";
import { getHomeContent } from "../lib/api";
import ProductSlideshow from "./ProductSlideshow";

const GOOGLE_FONTS = [
  "Mulish",
  "Noto Sans",
  "Noto Serif",
  "Playfair Display",
  "Cormorant Garamond",
  "Montserrat",
  "Poppins",
  "Inter",
  "DM Sans",
  "Lora",
  "Roboto",
];

function loadGoogleFonts() {
  const id = "orora-builder-google-fonts";

  if (document.getElementById(id)) return;

  const link = document.createElement("link");

  link.id = id;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=" +
    GOOGLE_FONTS
      .map(
        (font) =>
          `${font.replace(/ /g, "+")}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800`
      )
      .join("&family=") +
    "&display=swap";

  document.head.appendChild(link);
}

function createTextStyle(style = {}) {
  const s = style || {};
  const maxWidth =
    s.maxWidth == null
      ? undefined
      : Number(s.maxWidth) <= 100
      ? `${Number(s.maxWidth)}%`
      : `${Number(s.maxWidth)}px`;

  return {
    fontFamily: s.fontFamily
      ? String(s.fontFamily).includes(",")
        ? s.fontFamily
        : `"${s.fontFamily}", sans-serif`
      : undefined,

    fontSize:
      s.fontSize != null
        ? `${Number(s.fontSize)}px`
        : undefined,

    fontWeight:
      s.fontWeight != null
        ? Number(s.fontWeight)
        : undefined,

    color: s.color || undefined,

    fontStyle: s.italic || s.fontStyle === "italic"
      ? "italic"
      : s.fontStyle || undefined,

    letterSpacing:
      s.letterSpacing != null
        ? typeof s.letterSpacing === "number"
          ? `${Number(s.letterSpacing)}px`
          : s.letterSpacing
        : undefined,

    lineHeight:
      s.lineHeight != null
        ? Number(s.lineHeight)
        : undefined,

    textAlign:
      s.textAlign || undefined,

    marginTop:
      s.marginTop != null
        ? `${Number(s.marginTop)}px`
        : undefined,

    marginRight:
      s.marginRight != null
        ? `${Number(s.marginRight)}px`
        : undefined,

    marginBottom:
      s.marginBottom != null
        ? `${Number(s.marginBottom)}px`
        : undefined,

    marginLeft:
      s.marginLeft != null
        ? `${Number(s.marginLeft)}px`
        : undefined,

    paddingTop:
      s.paddingTop != null
        ? `${Number(s.paddingTop)}px`
        : undefined,

    paddingRight:
      s.paddingRight != null
        ? `${Number(s.paddingRight)}px`
        : undefined,

    paddingBottom:
      s.paddingBottom != null
        ? `${Number(s.paddingBottom)}px`
        : undefined,

    paddingLeft:
      s.paddingLeft != null
        ? `${Number(s.paddingLeft)}px`
        : undefined,

    maxWidth,
  };
}

function normalizeBuilder(data) {
  const builder = data?.aboutBuilder || {};
  const styles = data?.aboutStyles || {};

  const defaultStyle = {
    fontFamily: "Mulish",
    fontSize: 16,
    fontWeight: 400,
    color: "#3a1526",
    italic: false,
    letterSpacing: 0,
    lineHeight: 1.5,
    textAlign: "left",
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    maxWidth: 100,
  };

  const defaultData = {
    section: {
      background: "#fffafc",
      paddingTop: 140,
      paddingBottom: 140,
      gap: 7,
    },

    label: {
      text:
        data?.storyLabel ||
        "CÂU CHUYỆN CỦA CHÚNG TÔI",

      style: {
        ...defaultStyle,
        fontSize: 12,
        fontWeight: 500,
        color: "#b8446d",
        letterSpacing: 4,
        lineHeight: 1.2,
        marginBottom: 18,
      },
    },

    title: {
      text:
        data?.storyTitle ||
        "Đẹp từ những điều",

      style: {
        ...defaultStyle,
        fontFamily: "Cormorant Garamond",
        fontSize: 80,
        fontWeight: 600,
        color: "#3a1526",
        letterSpacing: -2,
        lineHeight: 0.95,
      },
    },

    highlight: {
      text:
        data?.storyHighlight ||
        "giản dị",

      style: {
        ...defaultStyle,
        fontFamily: "Cormorant Garamond",
        fontSize: 80,
        fontWeight: 400,
        color: "#e2678f",
        italic: true,
        letterSpacing: -2,
        lineHeight: 0.95,
        marginBottom: 30,
      },
    },

    text: {
      text:
        data?.storyText ||
        "A simple space to tell your story.",

      style: {
        ...defaultStyle,
        fontSize: 16,
        fontWeight: 300,
        color: "#755968",
        lineHeight: 1.85,
        maxWidth: 440,
        marginBottom: 30,
      },
    },

    image: {
      src: data?.storyImage || "/about.jpg",
      extras: Array.isArray(data?.storyImages) ? data.storyImages : ["", "", ""],
      width: 52,
      height: 620,
      radius: 200,
      borderWidth: 8,
    },

    stats:
      data?.storyStats?.length
        ? data.storyStats
        : [
            {
              value: "test",
              suffix: "",
              label: "Sản phẩm",
            },
            {
              value: "test",
              suffix: "",
              label: "Khách hàng",
            },
            {
              value: "test",
              suffix: "",
              label: "Hài lòng",
            },
          ],

    statValue: {
      ...defaultStyle,
      fontFamily: "Cormorant Garamond",
      fontSize: 50,
      fontWeight: 600,
      color: "#b8446d",
      lineHeight: 1,
    },

    statLabel: {
      ...defaultStyle,
      fontSize: 13,
      fontWeight: 400,
      color: "#755968",
      lineHeight: 1.4,
    },
  };

  const result = {
    ...defaultData,
    ...builder,

    section: {
      ...defaultData.section,
      ...(builder.section || {}),
    },

    label: {
      ...defaultData.label,
      ...(builder.label || {}),
      style: {
        ...defaultData.label.style,
        ...(styles.label || {}),
        ...(builder.label?.style || {}),
      },
    },

    title: {
      ...defaultData.title,
      ...(builder.title || {}),
      style: {
        ...defaultData.title.style,
        ...(styles.title || {}),
        ...(builder.title?.style || {}),
      },
    },

    highlight: {
      ...defaultData.highlight,
      ...(builder.highlight || {}),
      style: {
        ...defaultData.highlight.style,
        ...(styles.highlight || {}),
        ...(builder.highlight?.style || {}),
      },
    },

    text: {
      ...defaultData.text,
      ...(builder.text || {}),
      style: {
        ...defaultData.text.style,
        ...(styles.text || {}),
        ...(builder.text?.style || {}),
      },
    },

    image: {
      ...defaultData.image,
      ...(builder.image || {}),
    },

    stats: Array.isArray(builder.stats)
      ? builder.stats
      : defaultData.stats,

    statValue: {
      ...defaultData.statValue,
      ...(styles.statValue || {}),
      ...(builder.statValue || {}),
    },

    statLabel: {
      ...defaultData.statLabel,
      ...(styles.statLabel || {}),
      ...(builder.statLabel || {}),
    },
  };

  return result;
}

function About({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const [home, setHome] = useState(null);

  useEffect(() => {
    loadGoogleFonts();

    if (preview) return;

    getHomeContent()
      .then((data) => {
        setHome(data || {});
      })
      .catch((err) => {
        console.error(
          "Không thể tải nội dung Story:",
          err
        );
      });
  }, [preview]);

  const builder = preview
    ? previewData || {}
    : normalizeBuilder(home || {});

  const section = builder.section || {};
  const label = builder.label || {};
  const title = builder.title || {};
  const highlight = builder.highlight || {};
  const text = builder.text || {};
  const image = builder.image || {};
  const stats = builder.stats || [];

  const select = (key) => {
    if (!preview || !onSelect) return;
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key
      ? "builder-selected"
      : "";

  const sectionStyle = {
    background:
      section.background || "#fffafc",

    paddingTop:
      section.paddingTop != null
        ? `${Number(section.paddingTop)}px`
        : undefined,

    paddingBottom:
      section.paddingBottom != null
        ? `${Number(section.paddingBottom)}px`
        : undefined,

    gap:
      section.gap != null
        ? `${Number(section.gap)}%`
        : undefined,
  };

  const imageStyle = {
    height:
      image.height != null
        ? `${Number(image.height)}px`
        : undefined,

    borderRadius:
      image.radius != null
        ? `${Number(image.radius)}px ${Number(
            image.radius
          )}px 28px 28px`
        : undefined,

    borderWidth:
      image.borderWidth != null
        ? `${Number(image.borderWidth)}px`
        : undefined,
  };

  const imageVisualWidth = {
    width:
      image.width != null
        ? `${Number(image.width)}%`
        : undefined,
  };

  const RevealBox = ({
    children,
    delay = 0,
    className = "",
  }) => {
    if (preview) {
      return (
        <div className={className}>
          {children}
        </div>
      );
    }

    return (
      <Reveal
        delay={delay}
        className={className}
      >
        {children}
      </Reveal>
    );
  };

  return (
    <section
      className="about"
      id="about"
      style={sectionStyle}
      data-builder-key={
        preview ? "section" : undefined
      }
      onClick={(e) => {
        if (
          preview &&
          e.target === e.currentTarget
        ) {
          select("section");
        }
      }}
    >
      <div
        className="about-visual"
        style={imageVisualWidth}
      >
        <RevealBox
          className={`about-image-wrapper ${selectedClass(
            "image"
          )}`}
        >
          <div
            data-builder-key={preview ? "image" : undefined}
            onClick={(e) => {
              if (!preview) return;
              e.stopPropagation();
              select("image");
            }}
            style={{ position: "absolute", inset: 0 }}
          >
            <ProductSlideshow
              images={[
                image.src || "/about.jpg",
                ...(Array.isArray(image.extras) ? image.extras : []),
              ]}
              alt="About"
            />
          </div>
        </RevealBox>
      </div>

      <div className="about-content">
        <RevealBox>
          <p
            className={`about-label ${selectedClass(
              "label"
            )}`}
            style={createTextStyle(
              label.style
            )}
            data-builder-key={
              preview ? "label" : undefined
            }
            onClick={(e) => {
              if (!preview) return;

              e.stopPropagation();
              select("label");
            }}
          >
            {label.text}
          </p>
        </RevealBox>

        <RevealBox delay={80}>
          <h2
            className={selectedClass("title")}
            style={createTextStyle(
              title.style
            )}
            data-builder-key={
              preview ? "title" : undefined
            }
            onClick={(e) => {
              if (!preview) return;

              e.stopPropagation();
              select("title");
            }}
          >
            {title.text}
          </h2>
        </RevealBox>

        <RevealBox delay={120}>
          <div
            className={selectedClass(
              "highlight"
            )}
            style={{
              ...createTextStyle(
                highlight.style
              ),
              display: "block",
            }}
            data-builder-key={
              preview ? "highlight" : undefined
            }
            onClick={(e) => {
              if (!preview) return;

              e.stopPropagation();
              select("highlight");
            }}
          >
            {highlight.text}
          </div>
        </RevealBox>

        <RevealBox delay={160}>
          <p
            className={`about-text ${selectedClass(
              "text"
            )}`}
            style={{
              ...createTextStyle(
                text.style
              ),
              whiteSpace: "pre-line",
            }}
            data-builder-key={
              preview ? "text" : undefined
            }
            onClick={(e) => {
              if (!preview) return;

              e.stopPropagation();
              select("text");
            }}
          >
            {text.text}
          </p>
        </RevealBox>

        <RevealBox delay={240}>
          <div className="about-stats">
            {(Array.isArray(stats) ? stats : []).map((item, index) => (
              <div key={index}>
                <strong
                  className={selectedClass(`statValue:${index}`)}
                  style={{
                    ...createTextStyle(builder.statValue),
                    display: "block",
                  }}
                  data-builder-key={
                    preview ? `statValue:${index}` : undefined
                  }
                  onClick={(e) => {
                    if (!preview) return;
                    e.stopPropagation();
                    select(`statValue:${index}`);
                  }}
                >
                  {item?.value == null || item?.value === ""
                    ? "test"
                    : item.value}
                  {item?.suffix || ""}
                </strong>

                <span
                  className={selectedClass(`statLabel:${index}`)}
                  style={{
                    ...createTextStyle(builder.statLabel),
                    display: "block",
                  }}
                  data-builder-key={
                    preview ? `statLabel:${index}` : undefined
                  }
                  onClick={(e) => {
                    if (!preview) return;
                    e.stopPropagation();
                    select(`statLabel:${index}`);
                  }}
                >
                  {item?.label}
                </span>
              </div>
            ))}
          </div>
        </RevealBox>
      </div>
    </section>
  );
}

export default About;