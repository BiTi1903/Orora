function rgba(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (/^#[\da-f]{3}$/i.test(text)) {
    return [...text.slice(1)].map(v => parseInt(v + v, 16)).concat(1);
  }
  if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(text)) {
    return [1, 3, 5].map(i => parseInt(text.slice(i, i + 2), 16))
      .concat(text.length === 9 ? parseInt(text.slice(7, 9), 16) / 255 : 1);
  }
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i.exec(text);
  if (!match) return null;
  const result = [+match[1], +match[2], +match[3], match[4] == null ? 1 : +match[4]];
  return result.every((v, i) => Number.isFinite(v) && v >= 0 && v <= (i === 3 ? 1 : 255)) ? result : null;
}

const composite = (front, back) => front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1 - front[3]));
const luminance = rgb => rgb.reduce((sum, v, i) => {
  const s = v / 255;
  return sum + [.2126, .7152, .0722][i] * (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4);
}, 0);

// Estimate translucent fills against light and dark imagery, not the actual image pixels.
export function contrastRatio(foreground, background) {
  const fg = rgba(foreground), bg = rgba(background);
  if (!fg || !bg) return null;
  return Math.min(...[[0, 0, 0], [255, 255, 255]].map(under => {
    const fill = composite(bg, under), ink = composite(fg, fill);
    const a = luminance(fill), b = luminance(ink);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  }));
}
