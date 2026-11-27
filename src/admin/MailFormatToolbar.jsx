const TOOLS = [
  { id: "bold", label: "B", title: "In đậm (**chữ**)", wrap: ["**", "**"], sample: "chữ đậm" },
  { id: "italic", label: "I", title: "In nghiêng (*chữ*)", wrap: ["*", "*"], sample: "chữ nghiêng" },
  { id: "accent", label: "Nhấn màu", title: "Tô màu nhấn (==chữ==)", wrap: ["==", "=="], sample: "ưu đãi nổi bật" },
  { id: "heading", label: "H2", title: "Tiêu đề phụ (## Tiêu đề)", linePrefix: "## ", sample: "Tiêu đề mục" },
  { id: "callout", label: "Hộp nổi bật", title: "Khung nhấn (> nội dung)", linePrefix: "> ", sample: "Thông tin quan trọng cần chú ý" },
  { id: "list", label: "• Danh sách", title: "Danh sách dấu chấm (- mục)", linePrefix: "- ", sample: "Mục danh sách" },
  { id: "divider", label: "— Kẻ ngang", title: "Đường kẻ phân cách", insert: "\n\n---\n\n" },
];

export default function MailFormatToolbar({ textRef, value, onChange, disabled }) {
  function apply(tool) {
    const el = textRef?.current;
    const current = String(value || "");
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : current.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : current.length;
    const selected = current.slice(start, end);

    let next = current;
    let cursorStart = start;
    let cursorEnd = end;

    if (tool.insert) {
      next = `${current.slice(0, start)}${tool.insert}${current.slice(end)}`;
      cursorStart = cursorEnd = start + tool.insert.length;
    } else if (tool.wrap) {
      const [before, after] = tool.wrap;
      const inner = selected || tool.sample;
      next = `${current.slice(0, start)}${before}${inner}${after}${current.slice(end)}`;
      cursorStart = start + before.length;
      cursorEnd = cursorStart + inner.length;
    } else if (tool.linePrefix) {
      const inner = selected || tool.sample;
      const prefixed = inner.split(/\r?\n/).map((line) => `${tool.linePrefix}${line}`).join("\n");
      const needLeadingBreak = start > 0 && current[start - 1] !== "\n" ? "\n\n" : "";
      const needTrailingBreak = end < current.length && current[end] !== "\n" ? "\n\n" : "";
      next = `${current.slice(0, start)}${needLeadingBreak}${prefixed}${needTrailingBreak}${current.slice(end)}`;
      cursorStart = start + needLeadingBreak.length + tool.linePrefix.length;
      cursorEnd = start + needLeadingBreak.length + prefixed.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange?.(cursorStart, cursorEnd);
    });
  }

  return (
    <div className="mail-format-toolbar" role="toolbar" aria-label="Định dạng nhanh nội dung thư">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={`mail-format-btn${tool.id === "bold" ? " is-bold" : tool.id === "italic" ? " is-italic" : ""}`}
          title={tool.title}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => apply(tool)}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
