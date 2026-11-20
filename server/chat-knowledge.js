import { chatSettings } from "../src/lib/chat.js";
import { withProductIdentity, findProductByRoute, productPath, productNumber } from "../src/lib/product-identity.js";
import { productSections, productSectionGroup } from "../src/lib/product-content.js";
import { productVolumeOptions } from "../src/lib/product-options.js";
import { availablePaymentMethods, PAYMENT_LABELS, formatProductPrice, socialShopUrl } from "../src/lib/commerce.js";
import { contactLinks } from "../src/lib/contact.js";

const text = (value, max = 1000) => typeof value === "string" ? value.trim().slice(0, max) : "";
export const searchText = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

export function buildChatKnowledge(records, home = {}, path = "") {
  const catalog = withProductIdentity(records);
  const products = home.sectionVisibility?.productdetail === false ? [] : catalog.filter((p) => p.active !== false && text(p.name)).map((p) => ({
    id: p.id, number: productNumber(p), name: text(p.name, 180), url: productPath(p),
    image: /^https?:\/\//.test(p.image || "") || /^\/(?!\/)/.test(p.image || "") ? p.image : "",
    price: text(formatProductPrice(p.price), 120) || "Liên hệ ORORA để báo giá",
    description: text(p.description, 500),
    volumes: productVolumeOptions(p).map((v) => ({ label: v.label, price: text(formatProductPrice(v.price || p.price), 120) || "Cần báo giá" })),
    sections: productSections(p).filter((s) => s && text(s.content)).slice(0, 12).map((s, index) => ({ title: text(s.title, 100), group: productSectionGroup(s, index), content: text(s.content, 1500) })),
  }));
  const match = /^\/product\/([^/?#]+)$/.exec(path);
  let current;
  try { current = match ? findProductByRoute(catalog, decodeURIComponent(match[1])) : null; } catch { /* Ignore invalid route encodings. */ }
  const contact = contactLinks(home, "", home.productDetailStyles?.contactActions || {});
  const links = [
    home.sectionVisibility?.collection !== false && { id: "catalog", label: "Xem tất cả sản phẩm", href: "/#shop" },
    { id: "tracking", label: "Tra cứu đơn hàng", href: "/tra-cuu-don-hang" },
    { id: "policy", label: "Chính sách đổi trả & bảo mật", href: "/chinh-sach" },
    home.sectionVisibility?.about !== false && { id: "about", label: "Về ORORA", href: "/#about" },
    home.sectionVisibility?.footer !== false && { id: "contact", label: "Thông tin liên hệ", href: "/#contact" },
    contact.zalo && { id: "zalo", label: "Nhắn ORORA qua Zalo", href: contact.zalo },
    contact.phone && { id: "phone", label: "Gọi ORORA", href: contact.phone },
    socialShopUrl(home.shopLinks?.facebookUrl, "facebook") && { id: "facebook", label: "Facebook ORORA", href: socialShopUrl(home.shopLinks.facebookUrl, "facebook") },
    socialShopUrl(home.shopLinks?.tiktokUrl, "tiktok") && { id: "tiktok", label: "TikTok ORORA", href: socialShopUrl(home.shopLinks.tiktokUrl, "tiktok") },
  ].filter(Boolean);
  return {
    settings: chatSettings(home.chatSettings), products, links,
    currentProduct: products.find((p) => p.id === current?.id) || null,
    policies: (Array.isArray(home.productPolicies) ? home.productPolicies : []).filter((p) => p && p.enabled !== false && text(p.title) && text(p.content)).slice(0, 12).map((p) => ({ title: text(p.title, 100), content: text(p.content, 1500) })),
    about: [text(home.storyTitle, 150), text(home.storyText, 1500)].filter(Boolean).join("\n"),
    payments: availablePaymentMethods(home).map((key) => PAYMENT_LABELS[key]),
    shipping: home.shippingSettings?.enabled === true ? "Phí giao hàng được tính trong form đặt hàng sau khi chọn tỉnh/thành và phường/xã. Chưa có địa chỉ thì chưa có báo giá phí ship." : "Phí giao hàng sẽ được ORORA xác nhận sau khi nhận yêu cầu đặt hàng.",
  };
}

export function rankedChatProducts(knowledge, messages) {
  const recent = messages.filter((m) => m.role === "user").slice(-3).map((m) => m.content).join(" ");
  const query = searchText(recent);
  const stop = new Set("toi muon can cho san pham nao orora cac va nhung gi nhu voi mot tu van tim xem biet the nay dung duoc la co khong ban minh ve theo cau giup nen tham khao cach huong dan thanh toan dat hang gia bao giao ship phi".split(" "));
  const words = [...new Set(query.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !stop.has(word)))];
  return knowledge.products.map((product, index) => {
    const name = searchText(product.name), body = searchText(`${product.description} ${product.sections.map((s) => s.content).join(" ")}`);
    const score = words.reduce((total, word) => total + (name.includes(word) ? 6 : body.includes(word) ? 1 : 0), product.id === knowledge.currentProduct?.id ? 3 : 0) + (query.includes(name) ? 30 : 0);
    return { product, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
}

export function chatReply(knowledge, { answer, productIds = [], linkIds = [], suggestions = [] }, mode = "ai", notice = "") {
  const products = [...new Set(productIds)].map((id) => knowledge.products.find((p) => p.id === id)).filter(Boolean).slice(0, 3).map(({ id, number, name, price, image, url }) => ({ id, number, name, price, image, url }));
  const links = [...new Set(linkIds)].map((id) => knowledge.links.find((link) => link.id === id)).filter(Boolean).slice(0, 4);
  return { mode, answer: String(answer || "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/gi, "").trim().slice(0, 2400), products, links, suggestions: [...new Set(suggestions.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim().slice(0, 100)))].slice(0, 3), ...(notice ? { notice } : {}) };
}

export function guidedChatReply(knowledge, messages, notice = "") {
  const query = searchText(messages.at(-1).content);
  const ranked = rankedChatProducts(knowledge, messages);
  const latest = rankedChatProducts({ ...knowledge, currentProduct: null }, [messages.at(-1)]);
  const chosen = latest[0]?.score > 0 ? latest[0].product : knowledge.currentProduct || (ranked[0]?.score > 0 ? ranked[0].product : null);
  const human = knowledge.links.filter((link) => ["zalo", "phone", "facebook", "tiktok", "contact"].includes(link.id)).map((link) => link.id);
  let reply;
  if (/lien he|nhan vien|nguoi that|zalo|facebook|tiktok|hotline/.test(query)) {
    reply = { answer: human.length ? "Bạn có thể liên hệ trực tiếp với ORORA qua các kênh bên dưới để được hỗ trợ thêm." : "ORORA chưa cập nhật kênh liên hệ tại đây. Bạn có thể xem thông tin trên website.", linkIds: human, suggestions: ["Tôi muốn xem sản phẩm", "Hướng dẫn đặt hàng"] };
  } else if (/tra cuu|kiem tra don|tinh trang don|theo doi don|ma don/.test(query)) {
    reply = { answer: "Bạn có thể kiểm tra tình trạng đơn hàng ngay tại trang Tra cứu đơn hàng bằng số điện thoại đặt hàng hoặc mã đơn kèm 4 số cuối điện thoại.", linkIds: ["tracking", ...human.slice(0, 1)], suggestions: ["Chính sách đổi trả & bảo mật", "Liên hệ nhân viên ORORA"] };
  } else if (/giao hang|van chuyen|phi ship|mien phi|doi tra|bao mat|chinh sach|thanh toan|dat hang|mua hang/.test(query)) {
    const policies = knowledge.policies.filter((p) => /giao hang|van chuyen|doi tra|thanh toan|bao mat/.test(searchText(p.title)));
    reply = { answer: ["Để đặt hàng, mở sản phẩm, chọn dung tích và số lượng, rồi bấm Đặt hàng ngay để điền thông tin nhận hàng.", knowledge.shipping, knowledge.payments.length ? `Phương thức đang hỗ trợ: ${knowledge.payments.join("; ")}.` : "Website đang tạm ngưng nhận đơn trực tiếp.", ...policies.slice(0, 2).map((p) => `${p.title}: ${p.content}`)].join("\n\n"), productIds: chosen ? [chosen.id] : [], linkIds: ["policy", "tracking", "catalog", ...human.slice(0, 1)], suggestions: ["Tra cứu đơn hàng", "Liên hệ nhân viên ORORA"] };
  } else if (/cach (su )?dung|huong dan|su dung|hdsd/.test(query)) {
    const usage = chosen?.sections.filter((s) => s.group === "usage");
    reply = { answer: chosen ? usage.length ? `Hướng dẫn đã đăng cho ${chosen.name}:\n\n${usage.map((s) => s.content).join("\n\n")}` : `ORORA chưa đăng hướng dẫn sử dụng đầy đủ cho ${chosen.name}. Bạn có thể mở chi tiết hoặc liên hệ ORORA để được hướng dẫn đúng sản phẩm.` : "Bạn muốn xem cách sử dụng sản phẩm nào? Chọn một sản phẩm bên dưới hoặc nhập tên sản phẩm giúp mình nhé.", productIds: chosen ? [chosen.id] : ranked.slice(0, 3).map((p) => p.product.id), linkIds: chosen && !usage.length ? human.slice(0, 1) : [], suggestions: ["Xem thành phần sản phẩm", "Hướng dẫn đặt hàng"] };
  } else if (/phu hop|nhu cau|tu van/.test(query) && !chosen) {
    reply = { answer: "Bạn muốn chăm sóc vấn đề gì và có khoảng ngân sách dự kiến bao nhiêu? Bạn cũng có thể nhập tên sản phẩm để xem thông tin đã được ORORA đăng.", linkIds: ["catalog"], suggestions: ["Tôi muốn xem tất cả sản phẩm", "Tìm hiểu thành phần sản phẩm"] };
  } else {
    const picks = ranked.filter((p) => p.score > 0).slice(0, 3);
    const items = picks.length ? picks : ranked.slice(0, 3);
    reply = { answer: items.length ? `${picks.length ? "Bạn có thể tham khảo" : "Bạn có thể khám phá"} những sản phẩm bên dưới.${chosen?.description ? `\n\n${chosen.name}: ${chosen.description}` : ""}\n\nBạn muốn tìm hiểu công dụng, thành phần hay cách sử dụng sản phẩm nào?` : "ORORA chưa có thông tin sản phẩm phù hợp để hiển thị. Bạn có thể liên hệ cửa hàng để được hỗ trợ.", productIds: items.map((p) => p.product.id), linkIds: items.length ? ["catalog"] : human.slice(0, 2), suggestions: ["Tư vấn theo nhu cầu", "Cách sử dụng sản phẩm", "Liên hệ ORORA"] };
  }
  return chatReply(knowledge, reply, "guided", notice);
}
