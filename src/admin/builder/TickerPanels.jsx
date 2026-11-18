import { DEFAULT_TICKER } from "./defaults";
import { toCss } from "../../lib/typography";
import { SettingGroup, StyleTypographyBlock, ColorField } from "./ui";
import { BUILDER_COLOR_DEFAULTS } from "../controls/color-defaults";

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
        <ColorField
          label="Màu nền"
          value={styles.band?.color}
          fallback={BUILDER_COLOR_DEFAULTS.tickerBand}
          onChange={(bandColor) => onChange({ bandColor })}
        />
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
