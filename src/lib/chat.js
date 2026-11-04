import { FONT_OPTIONS } from "./typography.js";

export const CHAT_MESSAGE_LIMIT = 1200;
export const CHAT_HISTORY_LIMIT = 16;
export const DEFAULT_CHAT_STARTERS = [
  { id: "products", label: "Khám phá sản phẩm", prompt: "ORORA đang có những sản phẩm nào?" },
  { id: "advice", label: "Tìm sản phẩm phù hợp", prompt: "Tôi muốn được tư vấn chọn sản phẩm phù hợp với nhu cầu." },
  { id: "usage", label: "Cách sử dụng", prompt: "Tôi muốn biết cách sử dụng sản phẩm." },
  { id: "shopping", label: "Đặt hàng & giao hàng", prompt: "Hướng dẫn tôi đặt hàng và tìm hiểu phí giao hàng." },
];

export function chatSettings(value = {}) {
  const s = value || {};
  const text = (key, fallback, limit) => typeof s[key] === "string" && s[key].trim() ? s[key].trim().slice(0, limit) : fallback;
  return {
    enabled: s.enabled !== false,
    hintEnabled: s.hintEnabled !== false,
    hintDelay: Number.isFinite(Number(s.hintDelay)) ? Math.min(60, Math.max(1, Number(s.hintDelay))) : 5,
    hintText: text("hintText", "Bạn cần tư vấn? Nhắn ORORA nhé!", 160),
    textStyles: s.textStyles && typeof s.textStyles === "object" ? s.textStyles : {},
    labels: s.labels && typeof s.labels === "object" ? s.labels : {},
    fontFamily: FONT_OPTIONS.some((font) => font.value === s.fontFamily) ? s.fontFamily : "",
    title: text("title", "Trợ lý ORORA", 60),
    greeting: text("greeting", "Chào bạn! Mình có thể giúp bạn tìm sản phẩm, xem cách sử dụng hoặc hướng dẫn đặt hàng. Bạn đang cần hỗ trợ gì?", 600),
    placeholder: text("placeholder", "Nhập câu hỏi của bạn…", 100),
    tone: ["warm", "concise", "detailed"].includes(s.tone) ? s.tone : "warm",
    knowledge: typeof s.knowledge === "string" ? s.knowledge.trim().slice(0, 8000) : "",
    starters: (Array.isArray(s.starters) ? s.starters : DEFAULT_CHAT_STARTERS).filter((item) => item && item.enabled !== false && typeof item.label === "string" && item.label.trim() && typeof item.prompt === "string" && item.prompt.trim()).slice(0, 6).map((item, index) => ({ id: String(item.id || index), label: item.label.trim().slice(0, 60), prompt: item.prompt.trim().slice(0, 400) })),
  };
}

export function safeChatHref(value) {
  if (typeof value !== "string") return null;
  if (/^\/(?:#(?:shop|about|contact))?$/.test(value) || /^\/product\/[a-z0-9-]+$/.test(value)) return value;
  if (/^tel:\+?\d{7,15}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const hosts = ["zalo.me", "facebook.com", "fb.com", "fb.me", "m.me", "tiktok.com"];
    if (url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) return url.href;
  } catch { /* Unknown destinations stay plain text. */ }
  return null;
}
