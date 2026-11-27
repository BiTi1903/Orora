export function orderTrackingMail(origin, code, enabled) {
  const url = enabled ? new URL("/tra-cuu-don-hang", origin) : new URL("mailto:sales@ororavn.com");
  if (code && enabled) url.searchParams.set("code", code);
  if (!enabled) url.search = "?subject=" + encodeURIComponent(("Hỗ trợ đơn hàng " + (code || "")).trim());
  const label = enabled ? "Tra cứu trạng thái đơn hàng" : "Liên hệ ORORA để kiểm tra tình trạng đơn";
  const hint = enabled
    ? "Nhập 4 số cuối số điện thoại đặt hàng để xem tiến trình chi tiết."
    : "Gửi mã đơn cho ORORA để hỏi tình trạng giao hàng.";
  return { url: url.href, label, hint, instructions: label + ": " + url.href + "\n" + hint };
}

export function trackingTemplate(text, enabled) {
  if (enabled || !text?.includes("{{trackingUrl}}")) return text;
  return text.split(/\r?\n/).flatMap(line => {
    if (line.includes("{{trackingUrl}}")) {
      return [line.replace(/(?:tra cứu|theo dõi)[^.!?{}\n]{0,100}\s*\{\{trackingUrl\}\}/gi, "{{trackingInstructions}}")
        .replaceAll("{{trackingUrl}}", "{{trackingInstructions}}")];
    }
    if (/^\s*\(?Nhập 4 số cuối số điện thoại.*chi tiết[.)]*\s*$/i.test(line)) return [];
    return [line];
  }).join("\n");
}
