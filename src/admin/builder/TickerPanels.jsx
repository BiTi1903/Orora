import { toCss } from "../../lib/typography";
import { SettingGroup, SelectField, StyleTypographyBlock, TypographyControls } from "./ui";
import { SPACE_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE, HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function getTickerSelectedData(ticker, selected) {
  const map = {
    text: { label: "Câu chạy" },
    star: { label: "Dấu ✦" },
    band: { label: "Nền dải" },
  };
  const meta = map[selected] || map.text;
  return { type: selected === "band" ? "tickerBand" : "tickerText", data: ticker, meta };
}


export function TickerPreview({ ticker, selected, onSelect }) {
  const words = ticker.marqueeWords?.length ? ticker.marqueeWords : DEFAULT_TICKER.marqueeWords;
  const textStyle = toCss(ticker.marqueeStyles?.text, { responsive: false });
  const starStyle = toCss(ticker.marqueeStyles?.star, { responsive: false });
  const bg = ticker.marqueeStyles?.band?.color;
  const pick = (key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const row = words.map((word, i) => (
    <span
      key={`${word}-${i}`}
      className={selected === "text" ? "builder-selected" : ""}
      data-builder-key="text"
      style={textStyle}
      onClick={pick("text")}
    >
      {word}
      <b
        className={selected === "star" ? "builder-selected" : ""}
        data-builder-key="star"
        style={starStyle}
        onClick={pick("star")}
      >
        ✦
      </b>
    </span>
  ));

  return (
    <div
      className={`marquee${selected === "band" ? " builder-selected" : ""}`}
      style={bg ? { background: bg } : undefined}
      onClick={pick("band")}
    >
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}


export function TickerSettings({ selected, data, ticker, onChange, onStyleChange }) {
  if (!data) {
    return <div className="builder-empty">Chọn một thành phần trên preview.</div>;
  }

  const styles = ticker.marqueeStyles || {};

  if (selected === "band" || data.type === "tickerBand") {
    return (
      <SettingGroup title="Nền dải">
        <div className="builder-field">
          <label>Màu nền</label>
          <input
            type="color"
            value={styles.band?.color || "#fffafc"}
            onChange={(e) => onChange({ bandColor: e.target.value })}
          />
        </div>
      </SettingGroup>
    );
  }

  if (selected === "text") {
    return (
      <>
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>Mỗi dòng một câu</label>
            <textarea
              rows={7}
              value={(ticker.marqueeWords || []).join("\n")}
              onChange={(e) =>
                onChange({
                  marqueeWords: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </SettingGroup>
        <StyleTypographyBlock style={styles.text || {}} onStyleChange={onStyleChange} />
      </>
    );
  }

  return <StyleTypographyBlock style={styles.star || {}} onStyleChange={onStyleChange} />;
}
