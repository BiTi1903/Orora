import { SLOGAN_SYMBOLS } from "../lib/product-slogan";
import SloganSymbol from "../components/SloganSymbol";

function CheckMark() {
  return <span className="slogan-visual-check" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 8 3 3 5-6" /></svg></span>;
}

function SampleCopy() {
  return <span className="slogan-sample-copy"><i /><i /><i /><i /></span>;
}

function SampleFrame({ symbol, solid, custom, mode, layout = "corners", position = "top", x = 50, y = 15 }) {
  const glyph = <SloganSymbol name={symbol === "none" ? "sparkle" : symbol} solid={solid} custom={custom?.trim() || "Aa"} />;
  const horizontal = x !== "" && Number.isFinite(Number(x)) ? Math.min(100, Math.max(0, Number(x))) : 50;
  const vertical = y !== "" && Number.isFinite(Number(y)) ? Math.min(100, Math.max(0, Number(y))) : 15;
  return <span className={`slogan-sample-frame is-${mode}${mode === "position" ? ` at-${position}` : ""}`} aria-hidden="true">
    {mode === "symbol" ? symbol === "none" ? <svg className="slogan-sample-empty" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="20" r="13" /><path d="m11 29 18-18" /></svg> : <span className="slogan-sample-single">{glyph}</span> : <>
      <SampleCopy />
      {mode === "decoration" && layout !== "none" && <span className={`slogan-sample-pattern is-${layout}`}>{Array.from({ length: layout === "scattered" ? 4 : 2 }, (_, index) => <span key={index}>{glyph}</span>)}</span>}
      {mode === "position" && <span className="slogan-sample-position" style={position === "custom" ? { left: `${horizontal}%`, top: `${vertical}%`, transform: `translate(-${horizontal}%, -${vertical}%)` } : undefined}>{glyph}</span>}
      {mode === "position" && position === "custom" && <span className="slogan-sample-crosshair" />}
    </>}
  </span>;
}

function VisualOption({ label, selected, children, onClick }) {
  return <button type="button" className="slogan-visual-option" aria-label={label} aria-pressed={selected} onClick={onClick}>
    {children}<span className="slogan-visual-caption">{label}</span>{selected && <CheckMark />}
  </button>;
}

export function SloganSymbolPicker({ value, onChange, decoration = false }) {
  const choices = decoration ? SLOGAN_SYMBOLS.filter(([key]) => key !== "none") : [SLOGAN_SYMBOLS.find(([key]) => key === "none"), ...SLOGAN_SYMBOLS.filter(([key]) => key !== "none")];
  const selected = decoration ? value.decorationSymbol : value.symbol;
  const custom = decoration ? value.decorationCustomSymbol : value.customSymbol;
  return <div className="slogan-visual-options" role="group" aria-label={decoration ? "Chọn mẫu họa tiết" : "Chọn biểu tượng Slogan"}>{choices.map(([key, label]) => <VisualOption key={key} label={label} selected={selected === key} onClick={() => onChange(key)}>
    <SampleFrame mode={decoration ? "decoration" : "symbol"} symbol={key} custom={custom} solid={decoration ? value.decorationSolid : value.solid} layout={value.decorations === "none" ? "corners" : value.decorations} />
  </VisualOption>)}</div>;
}

export function SloganLayoutPicker({ value, onChange, decoration = false, x = 50, y = 15 }) {
  const choices = decoration ? [["none", "Không họa tiết"], ["corners", "Hai góc thẻ"], ["scattered", "Rải nhẹ trên nền"]] : [["top", "Trên tiêu đề"], ["heading", "Cạnh tiêu đề"], ["bottom", "Dưới nội dung"], ["custom", "Vị trí tùy chỉnh"]];
  return <div className={`slogan-layout-options${decoration ? " is-decoration" : ""}`} role="group" aria-label={decoration ? "Chọn bố trí họa tiết" : "Chọn vị trí biểu tượng"}>{choices.map(([key, label]) => <VisualOption key={key} label={label} selected={(decoration ? value.decorations : value.symbolPosition) === key} onClick={() => onChange(key)}>
    <SampleFrame mode={decoration ? "decoration" : "position"} symbol={decoration ? value.decorationSymbol : value.symbol} custom={decoration ? value.decorationCustomSymbol : value.customSymbol} solid={decoration ? value.decorationSolid : value.solid} layout={key} position={key} x={x} y={y} />
  </VisualOption>)}</div>;
}
