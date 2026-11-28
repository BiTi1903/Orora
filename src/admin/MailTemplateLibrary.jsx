import { orderTrackingMail, trackingTemplate } from "../lib/order-tracking-mail";
import { hasOrderTokens } from "../lib/template-kinds";
import { BUILTIN_MAIL_PRESETS } from "../lib/mail-presets";
import { SAMPLE_PREVIEW_ORDER, previewOrderVariables } from "./mail-order-preview";
import { useConfirm } from "./confirm-context";
import { renderWelcomeEmailHtml, renderOrderEmailHtml, renderBrandedEmailHtml } from "../lib/mail-html";
import MailPreviewPane from "./MailPreviewPane";
import MailBodyBlocks from "./MailBodyBlocks";
import MailDesignFields from "./MailDesignFields";
import MailFormatToolbar from "./MailFormatToolbar";
import MailOrderTokenBar from "./MailOrderTokenBar";
import { TEMPLATE_KINDS, templateUsageLabel } from "../lib/mail-templates";
import { useEffect, useRef, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
import TranslationHelp from "./TranslationHelp";

function TemplatePreview({ draft, onSelectSection, selectedSection }) {
  const order = SAMPLE_PREVIEW_ORDER;
  const tracking = orderTrackingMail(window.location.origin, order.code, true);
  const isOrder = draft.kind === "order_auto" || hasOrderTokens(draft);
  const subject = isOrder ? previewOrderVariables(draft.subject || "", order, tracking) : (draft.subject || "");
  const text = isOrder ? previewOrderVariables(trackingTemplate(draft.text || "", true), order, tracking) : (draft.text || "");
  const render = isOrder ? renderOrderEmailHtml : draft.kind === "welcome_auto" ? renderWelcomeEmailHtml : renderBrandedEmailHtml;
  const html = render({
    ...draft,
    subject,
    text,
    order,
    siteOrigin: window.location.origin,
    unsubscribeUrl: isOrder ? "" : window.location.origin + "/api/unsubscribe?id=preview&token=preview",
    interactivePreview: Boolean(onSelectSection),
    selectedSection: selectedSection || "",
  });
  return <MailPreviewPane onSelectSection={onSelectSection} title={isOrder ? "Xem trước · Đơn minh họa" : "Xem trước giao diện mẫu"} html={html} subject={subject} text={text} />;
}

const empty = { categoryId: "", name: "", kind: "private", subject: "", text: "" };

export default function MailTemplateLibrary({ request, onUse, active = true }) {
  const confirm = useConfirm();
  const pendingId = useRef(null);
  const studioRef = useRef(null);
  const nameField = useRef(null);
  const subjectField = useRef(null);
  const textField = useRef(null);
  const activeFieldRef = useRef("text");
  const [draft, setDraft] = useState(() => ({
    categoryId: "",
    name: BUILTIN_MAIL_PRESETS[0].name,
    kind: BUILTIN_MAIL_PRESETS[0].kind,
    subject: BUILTIN_MAIL_PRESETS[0].subject,
    text: BUILTIN_MAIL_PRESETS[0].text,
    design: { ...BUILTIN_MAIL_PRESETS[0].design },
  }));
  const [designSection, setDesignSection] = useState("");
  const [id, setId] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [newType, setNewType] = useState("");
  const [templates, setTemplates] = useState([]);
  const [busyAction, setBusyAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        let cursor;
        const all = new Map();
        const seen = new Set();
        do {
          const page = await request(null, { templates: "1", ...(cursor ? { cursor } : {}) });
          if (!alive) return;
          if (page.types) setTypes(page.types);
          page.templates.forEach((item) => all.set(item.id, item));
          cursor = page.nextCursor;
          if (cursor && seen.has(cursor)) throw new Error("Không tải đủ mẫu thư. Vui lòng tải lại.");
          if (cursor) seen.add(cursor);
        } while (cursor);
        setTemplates([...all.values()].sort((a, b) => b.updatedAt - a.updatedAt));
      } catch (error) {
        if (alive) setNotice({ error: true, text: error.message });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [request, version, active]);

  const scrollToStudio = () => {
    requestAnimationFrame(() => {
      studioRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  };

  const edit = (item, messageText = "Đang chỉnh mẫu đã lưu.") => {
    pendingId.current = null;
    setId(item.id || null);
    setDraft({
      name: item.name,
      kind: item.kind,
      categoryId: item.categoryId || "",
      design: item.design ? { ...item.design } : undefined,
      subject: item.subject,
      text: item.text,
    });
    setPreview(null);
    setNotice({ text: messageText });
    scrollToStudio();
    requestAnimationFrame(() => nameField.current?.focus());
  };

  const loadPreset = (preset) => {
    const savedMatch = templates.find((t) => t.id === preset.id);
    pendingId.current = null;
    if (savedMatch && ["shipping", "delivered"].includes(preset.stage)) {
      edit(savedMatch, "Đang chỉnh mẫu tự động dùng khi đơn đổi trạng thái.");
      return;
    }
    setId(savedMatch || ["shipping", "delivered"].includes(preset.stage) ? preset.id : null);
    setDraft({
      name: preset.name,
      kind: preset.kind,
      categoryId: "",
      subject: preset.subject,
      text: preset.text,
      design: { ...preset.design },
    });
    setNotice({
      text: savedMatch
        ? `Đã nạp mẫu chuẩn “${preset.name}” vào khung thiết kế bên dưới. Bấm Lưu thay đổi mẫu khi sửa xong.`
        : `Đã nạp mẫu chuẩn “${preset.name}”. Chỉnh sửa bên dưới rồi bấm Lưu mẫu thư để lưu vào kho.`,
    });
    scrollToStudio();
  };

  const remove = async (item) => {
    if (busy || !await confirm(`Xóa mẫu “${item.name}” khỏi kho? Mẫu tự động và lịch sử thư đã gửi vẫn được giữ.`, { title: "Xóa mẫu thư", confirmLabel: "Xóa", danger: true })) return;
    setBusy(true);
    setBusyAction(`delete:${item.id}`);
    setNotice(null);
    try {
      const result = await request({ action: "deleteLibraryTemplate", id: item.id });
      setTemplates((items) => items.filter((template) => template.id !== item.id));
      if (id === item.id) {
        setId(null);
        pendingId.current = null;
        setDraft(empty);
      }
      if (preview?.id === item.id) setPreview(null);
      setNotice({ text: result.message });
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setBusy(false);
      setBusyAction("");
    }
  };

  const insertToken = (token) => {
    const field = activeFieldRef.current === "subject" ? "subject" : "text";
    const el = field === "subject" ? subjectField.current : textField.current;
    const current = draft[field] || "";
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : current.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : current.length;
    const updated = `${current.slice(0, start)}${token}${current.slice(end)}`;
    setDraft({ ...draft, [field]: updated });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange?.(pos, pos);
    });
  };

  const query = search.trim().toLowerCase();
  const visible = templates.filter(
    (item) =>
      (!selectedType || (selectedType.startsWith("custom:") ? item.categoryId === selectedType.slice(7) : item.kind === selectedType && !item.categoryId)) &&
      [item.name, item.subject].some((value) => value.toLowerCase().includes(query)),
  );

  const renderSavedCard = (item) => {
    const isEditing = id === item.id;
    const isOrderCard = item.kind === "order_auto" || hasOrderTokens(item);
    return (
      <article className={`mail-library-card${isEditing ? " is-editing" : ""}`} key={item.id || item.name}>
        <div className="mail-library-card-top">
          <span className="mail-preset-badge">
            {item.id === "builtin-order-shipping" ? "Tự động khi đang giao" : item.id === "builtin-order-thankyou" ? "Tự động khi hoàn tất" : item.categoryName || (isOrderCard && item.kind === "private" ? "Mẫu đơn hàng gửi riêng" : TEMPLATE_KINDS[item.kind] || item.kind)}
          </span>
          <span className={`mail-usage-badge ${item.usedRevisions?.includes(item.revision || 1) ? "sent" : ""}`}>
            v{item.revision || 1} · {templateUsageLabel(item)}
          </span>
        </div>
        <button type="button" className="admin-template-link mail-library-card-title" onClick={() => setPreview({ ...item, saved: true })}>
          {item.name}
        </button>
        <p className="mail-library-card-subject">{item.subject}</p>
        <div className="admin-actions mail-library-card-actions">
          <button type="button" className="admin-btn primary" disabled={busy} onClick={() => edit(item)}>
            {isEditing ? "Đang chỉnh" : "Chỉnh sửa"}
          </button>
          {onUse && (
            <button type="button" className="admin-btn" disabled={busy} onClick={() => onUse({ ...item, saved: true })}>
              {item.kind !== "private" ? "Áp dụng" : "Dùng gửi"}
            </button>
          )}
          <button
            type="button"
            className="admin-btn"
            disabled={busy}
            onClick={() => edit({ ...item, id: null, name: item.name.slice(0, 90) + " (bản sao)" }, "Đang soạn bản sao. Chọn Lưu mẫu thư để thêm vào kho.")}
          >
            Nhân bản
          </button>
          <button
            type="button"
            className="admin-btn danger"
            aria-busy={busy && busyAction === `delete:${item.id}`}
            disabled={busy}
            aria-label={`Xóa mẫu ${item.name}`}
            onClick={() => remove(item)}
          >
            Xóa mẫu
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="mail-library-page">
      <div className="admin-top">
        <div>
          <h2>Mẫu Thư & Email Studio</h2>
          <p className="admin-muted">Chọn một mẫu chuẩn hoặc mẫu đã lưu để thiết kế trực quan với khung xem trước song song.</p>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn primary"
            disabled={busy}
            onClick={() => {
              pendingId.current = null;
              setId(null);
              setDraft(empty);
              scrollToStudio();
              requestAnimationFrame(() => nameField.current?.focus());
            }}
          >
            + Tạo mẫu trắng mới
          </button>
          <button type="button" className="admin-btn" disabled={loading || busy} onClick={() => setVersion((value) => value + 1)}>
            Tải lại mẫu
          </button>
        </div>
      </div>

      {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}

      <section className="admin-card mail-preset-shelf" aria-label="Bộ mẫu chuẩn ORORA">
        <div className="mail-shelf-head">
          <div>
            <h3>Bộ 4 mẫu chuẩn theo hành trình khách hàng <TranslationHelp label="bộ 4 mẫu thư chuẩn">Mẫu Đăng ký và Đã nhận đơn dùng làm thư gửi tự động. Khi đơn chuyển sang Đang giao hoặc Hoàn tất, hệ thống tự gửi mẫu tương ứng tới email của khách. Lưu thay đổi trong Studio để áp dụng cho các lần gửi sau.</TranslationHelp></h3>
            <p className="admin-muted">Bấm vào một giai đoạn để nạp sẵn bố cục, tiến trình đơn và nội dung chuẩn vào Studio bên dưới.</p>
          </div>
        </div>
        <div className="mail-preset-grid">
          {BUILTIN_MAIL_PRESETS.map((preset) => (
            <div className="mail-preset-card" key={preset.id}>
              <span className="mail-preset-badge">{preset.badge}</span>
              <strong>{preset.name}</strong>
              <p>{preset.description}</p>
              <button type="button" className="admin-btn" disabled={busy} onClick={() => loadPreset(preset)}>
                Nạp vào Studio chỉnh sửa
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card mail-saved-shelf" aria-label="Kho mẫu đã lưu">
        <div className="mail-shelf-head">
          <h3>Mẫu đã lưu ({visible.length}/{templates.length})</h3>
          <div className="mail-saved-filters">
            <div className="admin-field">
              <label htmlFor="library-filter-type">Lọc theo loại mẫu</label>
              <select id="library-filter-type" className="mail-template-select" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                <option value="">Tất cả loại mẫu</option>
                {Object.entries(TEMPLATE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                {types.map((type) => <option key={type.id} value={`custom:${type.id}`}>{type.name}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="library-search">Tìm mẫu đã lưu</label>
              <input id="library-search" type="search" placeholder="Tên hoặc tiêu đề mẫu…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
        </div>
        {loading ? (
          <p className="admin-muted">Đang tải mẫu…</p>
        ) : visible.length > 0 ? (
          <div className="mail-library-grid">{visible.map(renderSavedCard)}</div>
        ) : (
          <p className="admin-muted">Chưa có mẫu phù hợp. Hãy chọn một mẫu chuẩn phía trên hoặc tạo mẫu mới bên dưới.</p>
        )}
      </section>

      <form
        ref={studioRef}
        aria-busy={busy && ["save", "type"].includes(busyAction)}
        className="admin-card admin-form mail-studio-card"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setBusyAction("save");
          setNotice(null);
          try {
            const templateId = id || pendingId.current || crypto.randomUUID();
            pendingId.current = templateId;
            const result = await request({ action: "saveLibraryTemplate", id: templateId, ...draft });
            setId(templateId);
            setNotice({ text: result.message });
            setVersion((value) => value + 1);
          } catch (error) {
            setNotice({ error: true, text: error.message });
          } finally {
            setBusy(false);
            setBusyAction("");
          }
        }}
      >
        <div className="mail-studio-topbar">
          <div>
            <h3>{id ? `Chỉnh mẫu đã lưu · ${draft.name || ""}` : "Soạn & Thiết kế mẫu thư"} <TranslationHelp label="chỉnh mẫu trong studio">Bấm trực tiếp vào từng khối trong khung Xem trước bên phải (Đầu thư, Tiêu đề, Nội dung, Nút bấm, Chân thư) để mở nhanh đúng mục chỉnh màu sắc và cỡ chữ.</TranslationHelp></h3>
            <p className="admin-muted">Chỉnh cột trái và quan sát trực tiếp kết quả ở khung Xem trước cố định bên phải.</p>
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn"
              disabled={busy}
              onClick={() => {
                pendingId.current = null;
                setId(null);
                setDraft(empty);
              }}
            >
              Tạo mẫu mới
            </button>
            <button className="admin-btn primary" aria-busy={busy && busyAction === "save"} disabled={busy}>
              {id ? "Lưu thay đổi mẫu" : "Lưu mẫu thư"}
            </button>
          </div>
        </div>

        <div className="mail-writer-grid">
          <div className="mail-writer-main">
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="library-name">Tên mẫu thư</label>
                <input
                  ref={nameField}
                  id="library-name"
                  required
                  maxLength={100}
                  disabled={busy}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Ví dụ: Đang giao hàng, Cảm ơn nhận hàng…"
                />
              </div>
              <div className="admin-field">
                <label htmlFor="library-kind">Loại mẫu thư</label>
                <select
                  id="library-kind"
                  className="mail-template-select"
                  disabled={busy}
                  value={draft.categoryId ? `custom:${draft.categoryId}` : draft.kind}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      kind: event.target.value.startsWith("custom:") ? "private" : event.target.value,
                      categoryId: event.target.value.startsWith("custom:") ? event.target.value.slice(7) : "",
                    })
                  }
                >
                  {Object.entries(TEMPLATE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  {types.map((type) => <option key={type.id} value={`custom:${type.id}`}>{type.name}</option>)}
                </select>
              </div>
            </div>

            <details className="mail-inline-details">
              <summary>+ Thêm phân loại mẫu riêng</summary>
              <div className="mail-new-type-row">
                <div className="admin-field" style={{ flex: 1, margin: 0 }}>
                  <label htmlFor="library-new-type">Tên loại mẫu mới</label>
                  <input id="library-new-type" maxLength={60} disabled={busy} value={newType} onChange={(event) => setNewType(event.target.value)} placeholder="Ví dụ: Chăm sóc sau mua, VIP…" />
                </div>
                <button
                  type="button"
                  className="admin-btn"
                  aria-busy={busy && busyAction === "type"}
                  disabled={busy || !newType.trim()}
                  onClick={async () => {
                    setBusy(true);
                    setBusyAction("type");
                    try {
                      const result = await request({ action: "addTemplateType", name: newType });
                      setTypes((items) => [...new Map([...items, result.type].map((item) => [item.id, item])).values()]);
                      setDraft({ ...draft, kind: "private", categoryId: result.type.id });
                      setNewType("");
                      setNotice({ text: result.message });
                    } catch (error) {
                      setNotice({ error: true, text: error.message });
                    } finally {
                      setBusy(false);
                      setBusyAction("");
                    }
                  }}
                >
                  Thêm loại
                </button>
              </div>
            </details>

            <div className="admin-field">
              <label htmlFor="library-subject">Tiêu đề mẫu thư</label>
              <input
                ref={subjectField}
                id="library-subject"
                required
                maxLength={200}
                disabled={busy}
                value={draft.subject}
                onFocus={() => { activeFieldRef.current = "subject"; }}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="library-text">Nội dung mẫu thư</label>
              <MailFormatToolbar textRef={textField} value={draft.text} disabled={busy} onChange={(text) => setDraft({ ...draft, text })} />
              <textarea
                ref={textField}
                id="library-text"
                required
                rows={10}
                maxLength={20000}
                disabled={busy}
                value={draft.text}
                onFocus={() => { activeFieldRef.current = "text"; }}
                onChange={(event) => setDraft({ ...draft, text: event.target.value })}
              />
            </div>

            {draft.kind !== "welcome_auto" && <MailOrderTokenBar onInsert={insertToken} disabled={busy} />}

            <MailBodyBlocks text={draft.text} disabled={busy} onChange={(text) => setDraft({ ...draft, text })} />

            <MailDesignFields onEditBody={() => textField.current?.focus()}
              defaultOpen
              kind={draft.kind}
              hasOrderVars={hasOrderTokens(draft)}
              value={draft.design}
              disabled={busy}
              activeSection={designSection}
              onSectionChange={setDesignSection}
              onChange={(design) => setDraft({ ...draft, design })}
            />

          </div>

          <TemplatePreview draft={draft} onSelectSection={setDesignSection} selectedSection={designSection} />
        </div>
      </form>

      {preview && (
        <MailPreviewDialog title={preview.name} metadata={<TemplatePreview draft={preview} />} onClose={() => setPreview(null)}>
          <button type="button" className="admin-btn" onClick={() => edit(preview)}>Chỉnh sửa mẫu</button>
          {onUse && (
            <button type="button" className="admin-btn primary" onClick={() => { onUse(preview); setPreview(null); }}>
              {preview.kind !== "private" ? "Chọn cho thư tự động" : "Dùng để soạn thư"}
            </button>
          )}
        </MailPreviewDialog>
      )}
    </div>
  );
}
