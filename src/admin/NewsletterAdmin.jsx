import TranslationHelp from "./TranslationHelp";
import { useConfirm } from "./confirm-context";
import OutlookCheck from "./OutlookCheck";
import CampaignOutlookStatus from "./CampaignOutlookStatus";
import { hasOrderTokens } from "../lib/template-kinds";
import MailWriter from "./MailWriter";
import MailTemplateLibrary from "./MailTemplateLibrary";
import MailPreviewDialog from "./MailPreviewDialog";
import MailTemplatePicker from "./MailTemplatePicker";
import { mailActorLabel, groupMailTemplates, templateReference } from "../lib/mail-templates";
import { useCallback, useEffect, useRef, useState } from "react";
import { newsletterRequest as request } from "./newsletter-api";
import { ensureNewsletterTemplatesOnce, fetchNewsletterCached, getAdminCache } from "./admin-cache";
import useDraftGuard from "../hooks/useDraftGuard";
import { sameMailDesign } from "../lib/mail-design";

const EMPTY = { subject: "", text: "" };
const CONTACT_STATUS = { active: "Hoạt động", paused: "Tạm ngưng", unsubscribed: "Đã hủy đăng ký", bounced: "Bị trả lại" };
const STATUS = { draft: "Chưa gửi", sending: "Đang gửi", paused: "Tạm dừng", completed: "Hoàn tất" };


function ContactActions({ label, disabled, onApply }) {
  const [action, setAction] = useState("");
  return (
    <div className="newsletter-contact-actions">
      <select aria-label={label} value={action} onChange={(event) => setAction(event.target.value)} disabled={disabled}>
        <option value="">Chọn thao tác</option>
        <option value="activate">Hoạt động</option>
        <option value="pause">Tạm ngưng</option>
        <option value="delete">Xóa email</option>
      </select>
      <button type="button" className="admin-btn" aria-label={`Áp dụng: ${label}`} disabled={disabled || !action} onClick={() => {
        onApply(action);
        setAction("");
      }}>Áp dụng</button>
    </div>
  );
}

export default function NewsletterAdmin({ initialView = "contacts", viewRequest, onOpenOrderMail, onOpenExport }) {
  const confirm = useConfirm();
  const cached = getAdminCache("newsletter");
  const [outlookCampaign, setOutlookCampaign] = useState(null);
  const [preview, setPreview] = useState(null);
  const [picker, setPicker] = useState(null);
  const [view, setView] = useState(initialView === "compose" ? "write" : ["orders", "orderSend", "orderHistory", "export"].includes(initialView) ? "contacts" : initialView);
  const [lastViewRequest, setLastViewRequest] = useState(viewRequest);
  if (viewRequest !== lastViewRequest) {
    setLastViewRequest(viewRequest);
    setView(viewRequest?.view || "contacts");
  }
  const [writerMode, setWriterMode] = useState(initialView === "welcome" ? "welcome_auto" : "private");
  const [writerDrafts, setWriterDrafts] = useState({});
  const [recipientMode, setRecipientMode] = useState("selected");
  const [recipientIds, setRecipientIds] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [welcome, setWelcome] = useState(() => cached?.welcome || EMPTY);
  const [savedWelcome, setSavedWelcome] = useState(() => cached?.welcome || EMPTY);
  const [contacts, setContacts] = useState(() => cached?.contacts || []);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactFilter, setContactFilter] = useState("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [campaigns, setCampaigns] = useState(() => cached?.campaigns || []);
  const [cursor, setCursor] = useState(() => cached?.nextCursor ?? null);
  const [ready, setReady] = useState(() => Boolean(cached));
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const stop = useRef(false);
  const alive = useRef(true);

  const welcomeDraft = writerDrafts.welcome_auto;
  const hasUnsavedDrafts = sending
    || Boolean(writerDrafts.private?.subject?.trim() || writerDrafts.private?.text?.trim())
    || (ready && welcomeDraft && (welcomeDraft.subject !== savedWelcome.subject || welcomeDraft.text !== savedWelcome.text || !sameMailDesign(welcomeDraft.design, savedWelcome.design)))
    || (ready && (welcome.subject !== savedWelcome.subject || welcome.text !== savedWelcome.text || !sameMailDesign(welcome.design, savedWelcome.design)));
  useDraftGuard({ writerDrafts, welcome }, { enabled: ready, busy: sending, dirty: hasUnsavedDrafts });

  const load = useCallback(async ({ force = false } = {}) => {
    const data = await fetchNewsletterCached({ force: force || Boolean(getAdminCache("newsletter")) });
    if (!alive.current) return;
    setContacts(data.contacts);
    setSelectedContacts([]);
    setCursor(data.nextCursor);
    setCampaigns(data.campaigns);
    setWelcome(data.welcome);
    setSavedWelcome(data.welcome);
    setReady(true);
    ensureNewsletterTemplatesOnce();
  }, []);

  useEffect(() => {
    alive.current = true;
    load().catch((error) => { if (alive.current) setNotice({ error: true, text: error.message }); });
    return () => { alive.current = false; stop.current = true; };
  }, [load]);

  const perform = async (action) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try { await action(); } catch (error) { if (alive.current) setNotice({ error: true, text: error.message }); }
    finally { if (alive.current) setBusy(false); }
  };

  const filterContacts = (items) => items.filter((item) =>
    (contactFilter === "all" || item.status === contactFilter) &&
    item.email.toLowerCase().includes(emailSearch.trim().toLowerCase()));
  const visibleContacts = filterContacts(contacts);

  const loadRemainingContacts = async () => {
    let items = contacts;
    let next = cursor;
    while (next) {
      const page = await request(null, next);
      if (!alive.current) return null;
      items = [...new Map([...items, ...page.contacts].map((item) => [item.id, item])).values()];
      next = page.nextCursor;
      setContacts(items);
      setCursor(next);
    }
    return items;
  };

  const allVisibleSelected = visibleContacts.length > 0 && visibleContacts.every((item) => selectedContacts.includes(item.id));

  const manageContacts = async (ids, operation) => {
    if (busy || !ids.length) return;
    if (ids.length > 100) {
      setNotice({ error: true, text: "Chọn tối đa 100 email cho mỗi lần thao tác." });
      return;
    }
    if (operation === "delete" && !await confirm(`Xóa ${ids.length} email khỏi danh sách? Không thể hoàn tác thao tác này. Lịch sử thư đã gửi vẫn được giữ.`, { title: "Xóa email", confirmLabel: "Xóa", danger: true })) return;
    perform(async () => {
      const result = await request({ action: "manageContacts", operation, ids });
      if (!alive.current) return;
      const changed = new Map(result.updated.map((item) => [item.id, item.status]));
      setContacts((items) => items.filter((item) => changed.get(item.id) !== "deleted").map((item) => changed.has(item.id) ? { ...item, status: changed.get(item.id) } : item));
      setSelectedContacts((selected) => selected.filter((id) => !ids.includes(id)));
      setNotice({ text: result.message });
    });
  };

  const run = async (id) => {
    stop.current = false;
    setSending(true);
    try {
      while (!stop.current) {
        const result = await request({ action: "sendBatch", id });
        if (!alive.current) return;
        setCampaigns((items) => items.map((item) => item.id === id ? result.campaign : item));
        if (result.paused) {
          setNotice({ error: true, text: result.message || "Đã tạm dừng do có thư gửi lỗi hoặc chưa rõ kết quả. Kiểm tra cấu hình Microsoft trước khi tiếp tục. Các địa chỉ đã xử lý sẽ không tự gửi lại trong lần gửi này." });
          return;
        }
        if (result.completed) {
          setNotice({ text: "Đã xử lý xong thư. “Đã gửi đi” chưa bảo đảm thư đã vào hộp thư đến." });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
      }
      if (alive.current) setNotice({ text: "Đã tạm dừng. Bạn có thể tiếp tục từ lịch sử thư." });
    } finally { if (alive.current) setSending(false); }
  };

  const campaignTemplates = groupMailTemplates(campaigns);
  const currentMessage = writerDrafts[writerMode] || (writerMode === "welcome_auto" ? welcome : EMPTY) || EMPTY;
  const applyTemplate = (item) => {
    if (item.kind === "order_auto" || hasOrderTokens(item)) {
      const draft = { purpose: item.kind === "order_auto" ? "automation" : "send", design: item.design, subject: item.subject, text: item.text, templateKind: item.kind, ...(templateReference(item) ? { templateRef: templateReference(item) } : {}) };
      if (onOpenOrderMail) onOpenOrderMail(draft);
      else setNotice({ text: "Mẫu này dùng khi gửi email trong chi tiết đơn hàng." });
      setPicker(null); setPreview(null); return;
    }
    const mode = item.kind === "private" ? (picker ? writerMode : "private") : item.kind;
    setWriterDrafts((drafts) => ({ ...drafts, [mode]: { design: item.design, subject: item.subject, text: item.text, templateKind: item.kind, ...(templateReference(item) ? { templateRef: templateReference(item) } : {}) } }));
    setWriterMode(mode); setView(mode === "welcome_auto" ? "welcome" : "write"); setPicker(null); setPreview(null);
    setNotice({ text: "Đã chọn mẫu. Kiểm tra người nhận và nội dung trước khi lưu hoặc gửi." });
  };

  const activeContacts = contacts.filter((item) => item.status === "active");
  const eligibleIds = recipientIds.filter((id) => activeContacts.some((item) => item.id === id));
  const recipientOptions = activeContacts.filter((item) => item.email.toLowerCase().includes(recipientSearch.trim().toLowerCase()));
  const chooseRecipients = (ids, checked) => {
    const next = checked ? [...new Set([...eligibleIds, ...ids])] : eligibleIds.filter((id) => !ids.includes(id));
    if (next.length > 100) { setNotice({ error: true, text: "Chọn tối đa 100 người nhận cho mỗi thư. Bạn có thể dùng chế độ gửi toàn bộ danh sách." }); return; }
    setRecipientIds(next);
  };
  const sendCampaign = async (draft) => {
    if (recipientMode === "selected" && !eligibleIds.length) return;
    if (!await confirm(`Gửi “${draft.subject}” đến ${recipientMode === "selected" ? `${eligibleIds.length} email đã chọn:\n${eligibleIds.map((id) => activeContacts.find((item) => item.id === id)?.email).join("\n")}\n` : "toàn bộ email đang hoạt động trước thời điểm tạo thư"}? Mỗi khách nhận một thư riêng.`, { title: "Gửi chiến dịch", confirmLabel: "Gửi email" })) return;
    return perform(async () => {
      const id = crypto.randomUUID();
      await request({ action: "createCampaign", id, ...draft, ...(recipientMode === "selected" ? { recipientIds: eligibleIds } : {}) });
      await load();
      await run(id);
    });
  };

  return (
    <section aria-busy={busy}>
      <div className="admin-top">
        <div><h1>Email</h1><p className="admin-muted">Lưu người đăng ký, gửi thư tự động và gửi thư từ sales@ororavn.com.</p></div>
        <button className="admin-btn" disabled={busy} onClick={() => perform(load)}>Tải lại</button>
      </div>
      {notice && <div role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</div>}
      {sending && <button className="admin-btn" onClick={() => { stop.current = true; }}>Tạm dừng sau đợt hiện tại</button>}
      {!ready ? <p className="admin-muted">Cần kết nối API email để tải dữ liệu. Nếu có lỗi, kiểm tra cấu hình rồi bấm Tải lại.</p> : (
        <>
          <nav className="admin-section-tabs" aria-label="Các mục email marketing">
            {[["contacts", "Người đăng ký"], ["write", "Gửi thư"], ["history", "Đã gửi"], ["welcome", "Thư Đăng Ký"], ["templates", "Mẫu Thư"]].map(([key, label]) => <button type="button" key={key} aria-current={view === key ? "page" : undefined} onClick={() => { setView(key); if (key === "write") setWriterMode("private"); if (key === "welcome") setWriterMode("welcome_auto"); }}>{label}</button>)}
          </nav>

          {view === "templates" && <MailTemplateLibrary request={request} active onUse={applyTemplate} />}
          {(view === "write" || view === "welcome") && <div className="admin-email-panel">
          <MailWriter key={writerMode} title={writerMode === "private" ? "Gửi thư cho người đăng ký" : "Thư Đăng Ký tự động"} allowedModes={[writerMode]} mode={writerMode} onModeChange={setWriterMode} value={currentMessage} onChange={(message) => setWriterDrafts((drafts) => ({ ...drafts, [writerMode]: message }))} onChooseTemplate={() => setPicker(writerMode)} request={request} disabled={busy} onApply={async (_mode, message) => {
            const result = await request({ action: "saveWelcome", ...message });
            setWelcome({ ...message });
            setSavedWelcome({ ...message });
            setWriterDrafts((drafts) => { const next = { ...drafts }; delete next.welcome_auto; return next; });
            return result;
          }} onSendPrivate={sendCampaign} privateSendLabel={recipientMode === "selected" ? `Gửi tới ${eligibleIds.length} email đã chọn` : "Gửi đến toàn bộ email hoạt động"} privateSendDisabled={recipientMode === "selected" && !eligibleIds.length} privateRecipients={
            <fieldset className="newsletter-recipient-picker" disabled={busy}>
              <legend>Người nhận thư</legend>
              <label className="admin-check"><input type="radio" name="recipient-mode" checked={recipientMode === "selected"} onChange={() => setRecipientMode("selected")} />Chọn email cụ thể</label>
              <label className="admin-check"><input type="radio" name="recipient-mode" checked={recipientMode === "all"} onChange={() => setRecipientMode("all")} />Toàn bộ email đang hoạt động</label>
              <TranslationHelp label="chọn người nhận email">Chọn mục này khi muốn gửi cho toàn bộ danh sách đang hoạt động. Chọn email cụ thể nếu chỉ gửi cho một nhóm nhỏ.</TranslationHelp>
              {recipientMode === "selected" ? <>
                <div className="admin-field"><label htmlFor="recipient-search">Tìm người nhận</label><input id="recipient-search" type="search" placeholder="Nhập email…" value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} /></div>
                <label className="admin-check"><input type="checkbox" checked={recipientOptions.length > 0 && recipientOptions.every((item) => eligibleIds.includes(item.id))} disabled={!recipientOptions.length} onChange={(event) => chooseRecipients(recipientOptions.map((item) => item.id), event.target.checked)} />Chọn tất cả email đang hiển thị</label>
                <div className="newsletter-recipient-list" role="region" aria-label="Chọn người nhận thư" tabIndex={0}>
                  {recipientOptions.map((item) => <label className="admin-check" key={item.id}><input type="checkbox" checked={eligibleIds.includes(item.id)} onChange={(event) => chooseRecipients([item.id], event.target.checked)} />{item.email}</label>)}
                  {!recipientOptions.length && <p className="admin-muted">Không có email đang hoạt động phù hợp.</p>}
                </div>
                <div className="admin-actions"><span className="admin-muted" role="status">Đã chọn {eligibleIds.length} người nhận (tối đa 100).</span><button type="button" className="admin-btn" disabled={!eligibleIds.length} onClick={() => setRecipientIds([])}>Bỏ chọn tất cả</button>{cursor && <button type="button" className="admin-btn" onClick={() => perform(loadRemainingContacts)}>Tải toàn bộ email</button>}</div>
                <details className="newsletter-selected-recipients"><summary>Email đã chọn ({eligibleIds.length})</summary><div className="newsletter-selected-list">{eligibleIds.map((id) => { const email = activeContacts.find((item) => item.id === id)?.email; return <span className="newsletter-recipient-chip" key={id}><span>{email}</span><button type="button" aria-label={`Bỏ chọn ${email}`} onClick={() => chooseRecipients([id], false)}>×</button></span>; })}{!eligibleIds.length && <p className="admin-muted">Chưa chọn người nhận.</p>}</div></details>
                <p className="admin-muted">Chỉ gửi đến email đã chọn, kể cả khi bạn đổi từ khóa tìm kiếm. Email tạm ngưng hoặc hủy đăng ký không nhận thư.</p>
              </> : <p className="admin-muted">Gửi đến toàn bộ email đang hoạt động, gồm cả email chưa tải trên màn hình. Danh sách được kiểm tra lại khi gửi.</p>}
            </fieldset>
          } />
          </div>}
          {view === "history" && <div className="admin-card">
            <h2>Lịch sử gửi đến danh sách đăng ký</h2>
            <p className="admin-muted">20 thư gần nhất. Lịch sử thư xác nhận mua hàng nằm trong chi tiết từng đơn.</p>

            <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Tiêu đề</th><th>Mẫu lúc gửi</th><th>Tài khoản thao tác</th><th>Người nhận</th><th>Trạng thái</th><th>Kết quả</th><th>Thao tác</th></tr></thead>
              <tbody>{!campaigns.length && <tr><td colSpan={7}>Chưa có thư gửi đến danh sách đăng ký.</td></tr>}{campaigns.map((item) => <tr key={item.id}>
                <td className="mail-history-subject" title={item.subject}>{item.subject}</td><td><button type="button" className="admin-template-link" onClick={() => setPreview({ title: campaignTemplates.byMail.get(item.id)?.label || "Mẫu thư đã gửi", message: { design: item.design, subject: item.subject, text: item.text }, kind: "private" })}>{campaignTemplates.byMail.get(item.id)?.label || "Xem mẫu"}</button></td><td>{mailActorLabel(item)}</td><td>{item.recipientIds ? <details className="newsletter-history-recipients"><summary>{item.recipientIds.length} email đã chọn</summary><ul>{item.recipientIds.map((id, index) => <li key={id}>{item.recipientEmails?.[index] || `Email cũ không còn trong danh sách (${id.slice(0, 8)}…)`}</li>)}</ul></details> : "Toàn bộ email hoạt động"}</td><td>{STATUS[item.status] || item.status}</td><td><span className="mail-result-count">{item.accepted || 0} đã nhận</span>{item.failed > 0 && <small className="mail-result-error">{item.failed} lỗi</small>}{item.unknown > 0 && <small className="order-summary-note">{item.unknown} chưa rõ</small>}</td>
                <td><button type="button" className="admin-btn" onClick={() => setOutlookCampaign(item)}>Check</button>{item.status !== "completed" && <button type="button" className="admin-btn" disabled={busy} onClick={async () => {
                  if (await confirm(`Tiếp tục gửi thư “${item.subject}”?`, { title: "Tiếp tục chiến dịch", confirmLabel: "Tiếp tục gửi" })) perform(() => run(item.id));
                }}>Tiếp tục gửi</button>}</td>
              </tr>)}</tbody></table></div>
            <p className="admin-muted">Thư bị lỗi hoặc chưa rõ kết quả không được tự gửi lại. “Hoàn tất” nghĩa là đã quét xong danh sách, không bảo đảm mọi thư gửi thành công.</p>
          </div>}
          {view === "contacts" && <div className="admin-card">
            <h2>Email đã đăng ký ({contacts.length} đã tải)</h2>
            <div className="admin-order-filter-bar">
              <div className="admin-field">
                <label htmlFor="newsletter-email-search">Tìm kiếm email</label>
                <input id="newsletter-email-search" type="search" placeholder="Nhập email cần tìm…" value={emailSearch}
                  onChange={(event) => { setEmailSearch(event.target.value); setSelectedContacts([]); }} />
              </div>
              <div className="admin-field">
                <label htmlFor="newsletter-contact-filter">Trạng thái</label>
                <select id="newsletter-contact-filter" className="newsletter-contact-filter" aria-label="Lọc trạng thái email đã tải" value={contactFilter} disabled={busy} onChange={(event) => {
                  setContactFilter(event.target.value); setSelectedContacts([]);
                }}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="paused">Tạm ngưng</option>
                  <option value="bounced">Bị trả lại</option>
                  <option value="unsubscribed">Đã hủy đăng ký</option>
                </select>
              </div>
              <div className="admin-actions">
                <ContactActions label="Thao tác cho email đã chọn" disabled={busy || !selectedContacts.length} onApply={(operation) => manageContacts(selectedContacts, operation)} />
                {cursor && <button type="button" className="admin-btn" disabled={busy} onClick={() => perform(loadRemainingContacts)}>Tải toàn bộ</button>}
                {onOpenExport && <button type="button" className="admin-btn" disabled={busy} onClick={onOpenExport}>Xuất Excel / CSV</button>}
              </div>
            </div>
            <p className="admin-muted" role="status">{busy ? "Đang xử lý…" : `Hiển thị ${visibleContacts.length} email · Đã chọn ${selectedContacts.length} (tối đa 100)`}</p>
            <div className="newsletter-contact-scroll" role="region" aria-label="Danh sách email đã đăng ký" tabIndex={0}><table className="admin-table newsletter-contact-table"><thead><tr>
              <th><input type="checkbox" aria-label="Chọn tất cả email đang hiển thị" disabled={busy || !visibleContacts.length} checked={allVisibleSelected} onChange={(event) => {
                const ids = visibleContacts.map((item) => item.id);
                setSelectedContacts((selected) => event.target.checked ? [...new Set([...selected, ...ids])] : selected.filter((id) => !ids.includes(id)));
              }} /></th>
              <th>Email</th><th>Trạng thái</th><th>Thư Đăng Ký</th><th>Thao tác</th></tr></thead>
              <tbody>{visibleContacts.map((item) => <tr key={item.id}>
                <td><input type="checkbox" aria-label={`Chọn ${item.email}`} disabled={busy} checked={selectedContacts.includes(item.id)} onChange={(event) => {
                  setSelectedContacts((selected) => event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id));
                }} /></td>
                <td>{item.email}</td>
                <td><span className={`newsletter-contact-status ${item.status}`}>{CONTACT_STATUS[item.status] || item.status}</span></td>
                <td>{{ accepted: "Đã gửi đi", pending: "Đang gửi", failed: "Gửi lỗi", unknown: "Cần kiểm tra" }[item.mailStatus] || "—"}<OutlookCheck outlook={item.outlook} label={item.email} check={() => request({ action: "checkWelcomeOutlook", id: item.id })} /></td>
                <td><ContactActions label={`Thao tác cho ${item.email}`} disabled={busy} onApply={(operation) => manageContacts([item.id], operation)} /></td>
              </tr>)}</tbody></table></div>
            {!visibleContacts.length && <p className="admin-muted">Không có email phù hợp.</p>}
            {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => {
              const page = await request(null, cursor);
              setContacts((items) => [...new Map([...items, ...page.contacts].map((item) => [item.id, item])).values()]);
              setCursor(page.nextCursor);
            })}>Tải thêm email</button>}
          </div>}
        </>
      )}
      {outlookCampaign && <CampaignOutlookStatus campaign={outlookCampaign} request={request} onClose={() => setOutlookCampaign(null)} />}
      {picker && <MailTemplatePicker request={request} kind={picker} includePrivate={writerMode !== "private"} onUse={applyTemplate} onClose={() => setPicker(null)} onManage={() => { setPicker(null); setView("templates"); }} />}
      {preview && <MailPreviewDialog title={preview.title} message={preview.message} onClose={() => setPreview(null)}><button type="button" className="admin-btn" onClick={() => applyTemplate({ ...preview.message, kind: preview.kind })}>Dùng mẫu này</button></MailPreviewDialog>}
    </section>
  );
}
