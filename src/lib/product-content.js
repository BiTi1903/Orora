export const LEGACY_PRODUCT_SECTIONS = [
  ["story", "Câu chuyện sản phẩm"], ["material", "Chất liệu / thành phần"],
  ["size", "Kích thước / dung tích"], ["color", "Màu sắc"], ["origin", "Xuất xứ"],
];

// An explicitly saved array is authoritative, including an empty array.
// Reading/editing old records never overwrites their original fields.
export function productSections(product = {}) {
  if (Array.isArray(product.detailSections)) return product.detailSections;
  return LEGACY_PRODUCT_SECTIONS.filter(([key]) => typeof product[key] === "string" && product[key].trim()).map(([key, title]) => ({ id: `legacy-${key}`, title, content: product[key], legacyKey: key }));
}
export function secondaryProductImages(product = {}) {
  return Array.isArray(product.additionalImages) ? product.additionalImages : [product.image2, product.image3, product.image4, product.image5, product.image6].map((src) => typeof src === "string" ? src : "");
}
export function productImages(product = {}) {
  return [product.image, ...secondaryProductImages(product)].filter((src) => typeof src === "string" && src.trim()).map((src) => src.trim());
}

const listLine = /^(\s*)([-*•–]|\d+[.)])\s+(.*)$/;
export function formatProductList(text, start, end, kind) {
  const from = (start > 0 ? text.lastIndexOf("\n", start - 1) : -1) + 1;
  let to = text.indexOf("\n", end);
  if (end > start && text[end - 1] === "\n") to = end - 1;
  if (to < 0) to = text.length;
  const lines = text.slice(from, to).split("\n");
  const matches = (line) => kind === "dash" ? /^\s*-\s+/.test(line) : kind === "bullet" ? /^\s*•\s+/.test(line) : /^\s*\d+[.)]\s+/.test(line);
  const remove = kind === "none" || (lines.some((line) => line.trim()) && lines.every((line) => !line.trim() || matches(line)));
  const emptySelection = lines.every((line) => !line.trim());
  let number = 0;
  const changed = lines.map((line, index) => {
    const match = listLine.exec(line);
    const indent = match?.[1] || /^\s*/.exec(line)[0];
    const content = match ? match[3] : line.slice(indent.length);
    if (remove) return indent + content;
    if (!line.trim() && lines.length > 1 && (!emptySelection || index > 0)) return line;
    const marker = kind === "number" ? `${++number}. ` : kind === "bullet" ? "• " : "- ";
    return indent + marker + content;
  }).join("\n");
  return { text: text.slice(0, from) + changed + text.slice(to), start: from, end: from + changed.length };
}
export function continueProductList(text, cursor) {
  const from = (cursor > 0 ? text.lastIndexOf("\n", cursor - 1) : -1) + 1;
  const before = text.slice(from, cursor); const match = listLine.exec(before);
  if (!match) return null;
  const nextBreak = text.indexOf("\n", cursor);
  const restOfLine = text.slice(cursor, nextBreak < 0 ? text.length : nextBreak);
  if (!match[3].trim() && !restOfLine.trim()) return { text: text.slice(0, from) + text.slice(cursor), cursor: from };
  const marker = /^\d/.test(match[2]) ? `${Number.parseInt(match[2], 10) + 1}${match[2].at(-1)}` : match[2];
  const insert = `\n${match[1]}${marker} `;
  return { text: text.slice(0, cursor) + insert + text.slice(cursor), cursor: cursor + insert.length };
}
export function parseProductContent(text = "") {
  const blocks = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = listLine.exec(line);
    const type = !match ? "text" : /^\d/.test(match[2]) ? "number" : ["-", "–"].includes(match[2]) ? "dash" : "bullet";
    let block = blocks.at(-1);
    if (!block || block.type !== type) { block = { type, lines: [] }; blocks.push(block); }
    block.lines.push(match ? { text: match[3], ...(type === "number" ? { number: Number.parseInt(match[2], 10) } : {}) } : { text: line });
  }
  return blocks;
}
