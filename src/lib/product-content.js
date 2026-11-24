import { withProductIdentity } from "./product-identity.js";
export const LEGACY_PRODUCT_SECTIONS = [
  ["story", "Câu chuyện sản phẩm"], ["material", "Chất liệu / thành phần"],
  ["size", "Kích thước / dung tích"], ["color", "Màu sắc"], ["origin", "Xuất xứ"],
];

// An explicitly saved array is authoritative, including an empty array.
// Reading/editing old records never overwrites their original fields.
export function productSections(product = {}, legacyTitles = {}) {
  if (Array.isArray(product.detailSections)) return product.detailSections;
  return LEGACY_PRODUCT_SECTIONS.filter(([key]) => typeof product[key] === "string" && product[key].trim()).map(([key, title]) => ({ id: `legacy-${key}`, title: legacyTitles[key] || title, content: product[key], legacyKey: key }));
}
export function productInformationBlocks(product = {}) {
  const sections = Array.isArray(product.detailSections) ? product.detailSections : [];
  return sections.filter((section) => section && (
    (typeof section.image === "string" && section.image.trim()) ||
    ["fade", "rise", "none"].includes(section.effect)
  ));
}

export function normalizeProductBlockText(text) {
  return String(text ?? "").replace(/\\r\\n|\\n/g, "\n");
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

export const PRODUCT_CONTENT_GROUPS = { description: "Mô tả", specifications: "Thông số", usage: "Hướng dẫn sử dụng" };
export function productSectionGroup(section, index = 0) {
  if (Object.hasOwn(PRODUCT_CONTENT_GROUPS, section.group || "")) return section.group;
  const title = String(section.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
  if (/huong dan|cach (su )?dung|su dung|hdsd/.test(title)) return "usage";
  if (section.legacyKey === "story" || /mo ta|cau chuyen|cong dung|gioi thieu/.test(title)) return "description";
  if (section.legacyKey) return "specifications";
  return index === 0 ? "description" : "specifications";
}
export function groupedProductSections(sections) {
  const groups = { description: [], specifications: [], usage: [] };
  sections.forEach((section, index) => { if (section && (section.image?.trim?.() || section.content?.trim?.())) groups[productSectionGroup(section, index)].push(section); });
  return groups;
}
export function publishedProductReviews(product = {}) {
  // Manual/demo entries never contribute to a real customer rating or verified-purchase claim.
  return (Array.isArray(product.productReviews) ? product.productReviews : []).filter((review) => review && review.published === true && typeof review.name === "string" && review.name.trim() && typeof review.text === "string" && review.text.trim()).map((review) => ({ ...review, rating: Math.min(5, Math.max(1, Number.parseInt(review.rating, 10) || 5)) }));
}

export function compactRelatedProducts(products, current, limit = 4) {
  const seen = new Set();
  const catalog = withProductIdentity(products.filter((item) => {
    const key = item.id || item.slug;
    if (!key || !item.name || item.active === false || seen.has(key)) return false;
    seen.add(key); return true;
  }));
  const index = catalog.findIndex((item) => item.id === current.id || (item.slug && item.slug === current.slug));
  const start = index < 0 ? 0 : index + 1;
  const circular = [...catalog.slice(start), ...catalog.slice(0, start)];
  return circular.filter((item) => item.id !== current.id && (!item.slug || item.slug !== current.slug)).slice(0, Math.max(0, limit));
}

// Small allowlist of inline marks. Everything else remains plain text, never HTML.
export function parseProductInline(text='') {
  const root={children:[]},stack=[root];
  for(const token of String(text).split(/(\[\/?(?:b|i|u|s)\])/g)){
    const mark=/^\[(\/?)(b|i|u|s)\]$/.exec(token);
    if(!mark){if(token)stack.at(-1).children.push(token);continue;}
    if(!mark[1]){const node={mark:mark[2],children:[]};stack.at(-1).children.push(node);stack.push(node);}
    else if(stack.length>1&&stack.at(-1).mark===mark[2])stack.pop();
    else stack.at(-1).children.push(token);
  }
  return root.children;
}
export function formatProductInline(text,start,end,mark){
  if(!['b','i','u','s'].includes(mark))return {text,start,end};
  const open=`[${mark}]`,close=`[/${mark}]`,selected=text.slice(start,end);
  if(selected.includes('\n')){
    const lines=selected.split('\n'),parts=lines.map(line=>{const match=listLine.exec(line);return {prefix:match?line.slice(0,line.length-match[3].length):'',content:match?match[3]:line};});
    const remove=parts.filter(part=>part.content).every(part=>part.content.startsWith(open)&&part.content.endsWith(close));
    const changed=parts.map(({prefix,content})=>prefix+(!content?'':remove?content.slice(open.length,-close.length):open+content+close)).join('\n');
    return {text:text.slice(0,start)+changed+text.slice(end),start,end:start+changed.length};
  }
  if(text.slice(start-open.length,start)===open&&text.slice(end,end+close.length)===close)return {text:text.slice(0,start-open.length)+selected+text.slice(end+close.length),start:start-open.length,end:end-open.length};
  if(selected.startsWith(open)&&selected.endsWith(close))return {text:text.slice(0,start)+selected.slice(open.length,-close.length)+text.slice(end),start,end:end-open.length-close.length};
  return {text:text.slice(0,start)+open+selected+close+text.slice(end),start:start+open.length,end:end+open.length};
}
