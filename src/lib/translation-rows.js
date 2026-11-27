const textField = /(?:title|description|label|text|body|name|caption|highlight|eyebrow|prefix|suffix|placeholder|consent|copyright|heading|question|answer|content|imageAlt|shoppingGuide|details|story|hint|note|button|greeting|material|origin|category|marqueeWords|heroRotator|heroChip\d+|testimonialsTitleEnd)$/i;
const skip = /^(translations|translationSheet|slugAliases|productReviews|reviews)$/;
export const translationHeaders = ["Mã nội dung", "Vị trí", "Tiếng Việt", "English"];

export function translationRows(docKey, data) {
  const rows = [];
  function visit(value, path, field, legacy) {
    if (typeof value === "string") {
      const exactText = ["size","color","t","d"].includes(field) && !/^#[0-9a-f]+$/i.test(value);
      if ((!exactText && !textField.test(field)) || !value.trim() || /^(https?:|\/|#)/.test(value)) return;
      const key = JSON.stringify([docKey, ...path]);
      const saved = data.translationSheet?.[key];
      rows.push({key, where: [docKey === "home" ? "Trang chủ" : data.name, ...path].join(" › "),
        vi: value, en: saved?.vi === value ? saved.en : typeof legacy === "string" ? legacy : ""});
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => visit(item, [...path, item?.id ? '@' + item.id : i], field, legacy?.[i]));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        if (!skip.test(key)) visit(item, [...path, key], key, legacy?.[key]);
      }
    }
  }
  visit(data, [], "", data.translations?.en);
  return rows;
}

export function applySheet(base, original, docKey, locale) {
  if (locale !== "en" || !original.translationSheet) return base;
  function visit(value, source, path) {
    if (typeof source === "string") {
      const entry = original.translationSheet[JSON.stringify([docKey, ...path])];
      return entry?.vi === source && entry.en ? entry.en : value;
    }
    if (Array.isArray(source)) return source.map((item, i) => visit(value?.[i], item, [...path, item?.id ? '@' + item.id : i]));
    if (!source || typeof source !== "object") return value;
    const result = {...value};
    for (const key of Object.keys(source)) {
      if (!skip.test(key)) result[key] = visit(value?.[key], source[key], [...path, key]);
    }
    return result;
  }
  return visit(base, original, []);
}
