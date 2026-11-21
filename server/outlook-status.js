const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
const failure = (code) => new Error(code);
const plain = (value) => String(value || "").replace(/<\/?[a-z][^<>@]*>/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ");
const escaped = (value) => String(value).replace(/'/g, "''");
const webLink = (value) => { try { const url = new URL(value); return url.protocol === "https:" && ["outlook.office365.com", "outlook.office.com", "outlook.live.com"].includes(url.hostname) ? url.href : ""; } catch { return ""; } };
export const OUTLOOK_ERROR_MESSAGES = {
  outlook_configuration_missing: "Thiếu cấu hình ứng dụng Microsoft để đọc Outlook.",
  outlook_permission_missing: "Ứng dụng chưa được cấp Microsoft Graph Mail.Read (Application), admin consent hoặc phạm vi hộp thư sales. Quyền SMTP gửi thư không đủ để đọc Outlook.",
  outlook_auth_failed: "Microsoft từ chối xác thực đọc Outlook. Kiểm tra Client Secret và quyền Graph.",
  outlook_throttled: "Microsoft đang giới hạn lượt kiểm tra. Vui lòng thử lại sau.",
  outlook_unavailable: "Chưa kiểm tra được Outlook. Trạng thái đã lưu trước đó được giữ nguyên.",
};
export function createOutlookStatusReader(env = process.env, request = fetch) {
  let token; let expiresAt = 0;
  async function check(record) {
    const checkedAt = new Date().toISOString();
    if (!record.trackingId && !record.internetMessageId) return { state: "untracked", checkedAt };
    const sender = env.MS_SENDER_EMAIL || "sales@ororavn.com";
    if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) throw failure("outlook_configuration_missing");
    if (!token || expiresAt <= Date.now()) {
      let response;
      try { response = await request(`https://login.microsoftonline.com/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }), signal: AbortSignal.timeout(8000) }); } catch { throw failure("outlook_unavailable"); }
      if (!response.ok) throw failure("outlook_auth_failed");
      const data = await response.json(); if (!data.access_token) throw failure("outlook_auth_failed");
      token = data.access_token; expiresAt = Date.now() + Math.max(0, Number(data.expires_in || 3600) - 120) * 1000;
    }
    const root = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}`;
    const get = async (url) => {
      // Do not follow a nextLink to a non-Graph host or another mailbox.
      const target = new URL(url);
      if (target.origin !== "https://graph.microsoft.com" || !decodeURIComponent(target.pathname).toLowerCase().startsWith(`/v1.0/users/${sender}/`.toLowerCase())) throw failure("outlook_unavailable");
      let response;
      try { response = await request(url, { headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.body-content-type="text"' }, signal: AbortSignal.timeout(8000) }); } catch { throw failure("outlook_unavailable"); }
      if (response.status === 403) { token = null; expiresAt = 0; throw failure("outlook_permission_missing"); }
      if (response.status === 401) { token = null; throw failure("outlook_auth_failed"); }
      if (response.status === 429) throw failure("outlook_throttled");
      if (!response.ok) throw failure("outlook_unavailable");
      return response.json();
    };
    const submitted = millis(record.createdAt || record.startedAt || record.mailAcceptedAt) || Date.now();
    const from = new Date(submitted - 5 * 60000).toISOString();
    let sent = null;
    let id = record.internetMessageId || "";
    if (record.transport === "smtp" && id) {
      const query = new URLSearchParams({ "$filter": `internetMessageId eq '${escaped(id)}'`, "$select": "id,internetMessageId,webLink,toRecipients,sentDateTime", "$top": "5" });
      const data = await get(`${root}/mailFolders/sentitems/messages?${query}`);
      sent = (data.value || []).find((item) => item.internetMessageId === id && item.toRecipients?.some((recipient) => recipient.emailAddress?.address?.toLowerCase() === record.recipient.toLowerCase()));
    } else if (record.trackingId) {
      const until = new Date(submitted + 60 * 60000).toISOString();
      const query = new URLSearchParams({ "$filter": `sentDateTime ge ${from} and sentDateTime le ${until}`, "$select": "id,internetMessageId,internetMessageHeaders,webLink,toRecipients,sentDateTime", "$top": "50" });
      let next = `${root}/mailFolders/sentitems/messages?${query}`;
      for (let page = 0; next && page < 2 && !sent; page++) {
        const data = await get(next);
        sent = (data.value || []).find((item) => item.internetMessageHeaders?.some((header) => header.name.toLowerCase() === "x-orora-mail-id" && header.value === record.trackingId) && item.toRecipients?.some((recipient) => recipient.emailAddress?.address?.toLowerCase() === record.recipient.toLowerCase()));
        next = data["@odata.nextLink"];
      }
      id = sent?.internetMessageId || "";
    }
    // A sent-item copy is not proof of delivery. Search NDRs only by exact original ID + recipient.
    if (!id) return { state: "not_found", checkedAt };
    const query = new URLSearchParams({ "$filter": `receivedDateTime ge ${from}`, "$select": "id,body,internetMessageHeaders,webLink,receivedDateTime", "$expand": "singleValueExtendedProperties($filter=id eq 'String 0x001A')", "$top": "50", "$orderby": "receivedDateTime desc" });
    let next = `${root}/messages?${query}`; let limited = false;
    for (let page = 0; next && page < 3; page++) {
      const data = await get(next);
      for (const item of data.value || []) {
        const report = item.singleValueExtendedProperties?.some((property) => property.value === "REPORT.IPM.Note.NDR") || item.internetMessageHeaders?.some((header) => header.name.toLowerCase() === "content-type" && /report-type\s*=\s*"?delivery-status/i.test(header.value));
        if (!report) continue;
        const body = plain(item.body?.content);
        const emails = body.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
        if (!body.toLowerCase().includes(id.toLowerCase()) || !emails.some((email) => email.toLowerCase() === record.recipient.toLowerCase())) continue;
        const code = body.match(/\b5\.\d{1,3}\.\d{1,3}\b/)?.[0] || body.match(/\b4\.\d{1,3}\.\d{1,3}\b/)?.[0] || "";
        return { state: code.startsWith("4.") ? "delayed" : "bounced", checkedAt, diagnosticCode: code, webLink: webLink(item.webLink) };
      }
      next = data["@odata.nextLink"]; limited = Boolean(next);
    }
    return { state: sent ? "sent_item" : "not_found", checkedAt, scanLimited: limited, ...(sent ? { webLink: webLink(sent.webLink) } : {}) };
  };
  check.checkBatch = async function checkBatch(records) {
    const checkedAt = new Date().toISOString();
    if (!records.length) return [];
    const sender = env.MS_SENDER_EMAIL || "sales@ororavn.com";
    if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) throw failure("outlook_configuration_missing");
    if (!token || expiresAt <= Date.now()) {
      let response;
      try { response = await request(`https://login.microsoftonline.com/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }), signal: AbortSignal.timeout(8000) }); } catch { throw failure("outlook_unavailable"); }
      if (!response.ok) throw failure("outlook_auth_failed");
      const data = await response.json(); if (!data.access_token) throw failure("outlook_auth_failed");
      token = data.access_token; expiresAt = Date.now() + Math.max(0, Number(data.expires_in || 3600) - 120) * 1000;
    }
    const root = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}`;
    const get = async (url) => {
      const target = new URL(url);
      if (target.origin !== "https://graph.microsoft.com" || !decodeURIComponent(target.pathname).toLowerCase().startsWith(`/v1.0/users/${sender}/`.toLowerCase())) throw failure("outlook_unavailable");
      let response;
      try { response = await request(url, { headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.body-content-type="text"' }, signal: AbortSignal.timeout(8000) }); } catch { throw failure("outlook_unavailable"); }
      if (response.status === 403) { token = null; expiresAt = 0; throw failure("outlook_permission_missing"); }
      if (response.status === 401) { token = null; throw failure("outlook_auth_failed"); }
      if (response.status === 429) throw failure("outlook_throttled");
      if (!response.ok) throw failure("outlook_unavailable");
      return response.json();
    };
    const trackable = records.filter((r) => r.trackingId || r.internetMessageId);
    if (!trackable.length) return records.map(() => ({ state: "untracked", checkedAt }));
    const oldest = Math.min(...trackable.map((r) => millis(r.createdAt || r.startedAt || r.mailAcceptedAt) || Date.now()));
    const from = new Date(oldest - 5 * 60000).toISOString();
    // Fetch Sent Items once for the batch window to match trackingId / internetMessageId
    const sentQuery = new URLSearchParams({ "$filter": `sentDateTime ge ${from}`, "$select": "id,internetMessageId,internetMessageHeaders,webLink,toRecipients,sentDateTime", "$top": "50", "$orderby": "sentDateTime desc" });
    const sentItems = [];
    let nextSent = `${root}/mailFolders/sentitems/messages?${sentQuery}`;
    for (let page = 0; nextSent && page < 2; page++) {
      const data = await get(nextSent);
      sentItems.push(...(data.value || []));
      nextSent = data["@odata.nextLink"];
    }
    // Fetch NDR reports ONCE for the entire batch window (instead of 3 pages per email)
    const ndrQuery = new URLSearchParams({ "$filter": `receivedDateTime ge ${from}`, "$select": "id,body,internetMessageHeaders,webLink,receivedDateTime", "$expand": "singleValueExtendedProperties($filter=id eq 'String 0x001A')", "$top": "50", "$orderby": "receivedDateTime desc" });
    const ndrs = [];
    let nextNdr = `${root}/messages?${ndrQuery}`;
    let limited = false;
    for (let page = 0; nextNdr && page < 3; page++) {
      const data = await get(nextNdr);
      for (const item of data.value || []) {
        const isReport = item.singleValueExtendedProperties?.some((p) => p.value === "REPORT.IPM.Note.NDR")
          || item.internetMessageHeaders?.some((h) => h.name.toLowerCase() === "content-type" && /report-type\s*=\s*"?delivery-status/i.test(h.value));
        if (!isReport) continue;
        const body = plain(item.body?.content);
        const emails = (body.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).map((e) => e.toLowerCase());
        ndrs.push({ bodyLower: body.toLowerCase(), emails, body, webLink: webLink(item.webLink) });
      }
      nextNdr = data["@odata.nextLink"];
      limited = Boolean(nextNdr);
    }
    return records.map((record) => {
      if (!record.trackingId && !record.internetMessageId) return { state: "untracked", checkedAt };
      const recipientLower = String(record.recipient || "").toLowerCase();
      let sent = null;
      let id = record.internetMessageId || "";
      if (id) {
        sent = sentItems.find((item) => item.internetMessageId === id && item.toRecipients?.some((r) => r.emailAddress?.address?.toLowerCase() === recipientLower));
      } else if (record.trackingId) {
        sent = sentItems.find((item) => item.internetMessageHeaders?.some((h) => h.name.toLowerCase() === "x-orora-mail-id" && h.value === record.trackingId) && item.toRecipients?.some((r) => r.emailAddress?.address?.toLowerCase() === recipientLower));
        id = sent?.internetMessageId || "";
      }
      if (!id) return { state: "not_found", checkedAt };
      const idLower = id.toLowerCase();
      for (const ndr of ndrs) {
        if (!ndr.bodyLower.includes(idLower) || !ndr.emails.includes(recipientLower)) continue;
        const code = ndr.body.match(/\b5\.\d{1,3}\.\d{1,3}\b/)?.[0] || ndr.body.match(/\b4\.\d{1,3}\.\d{1,3}\b/)?.[0] || "";
        return { state: code.startsWith("4.") ? "delayed" : "bounced", checkedAt, diagnosticCode: code, webLink: ndr.webLink };
      }
      return { state: sent ? "sent_item" : "not_found", checkedAt, scanLimited: limited, ...(sent ? { webLink: webLink(sent.webLink) } : {}) };
    });
  };
  return check;
}
export async function syncOutlookStatus(ref, check, override = {}) {
  const saved = await ref.get();
  if (!saved.exists) throw Object.assign(new Error("Không tìm thấy bản ghi gửi thư."), { status: 404 });
  const data = saved.data();
  const record = { ...data, ...override };
  const trackingKey = record.trackingId || record.internetMessageId || "";
  const previous = data.outlook?.trackingKey === trackingKey ? data.outlook : null;
  if (previous?.checkedAt && Date.now() - millis(previous.checkedAt) < 60000) return previous;
  if (!check) throw failure("outlook_configuration_missing");
  const result = { ...(await check(record)), trackingKey };
  const durable = ["bounced", "delayed"].includes(previous?.state) && !["bounced", "delayed"].includes(result.state) ? { ...previous, checkedAt: result.checkedAt } : result;
  await ref.set({ outlook: durable }, { merge: true });
  return durable;
}
export async function syncOutlookBatch(items, check) {
  if (!items.length) return [];
  if (!check) throw failure("outlook_configuration_missing");
  if (typeof check.checkBatch !== "function") {
    const out = [];
    for (let i = 0; i < items.length; i += 4) {
      const chunk = items.slice(i, i + 4);
      const res = await Promise.all(chunk.map((item) => syncOutlookStatus(item.ref, check, item.override)));
      out.push(...res);
    }
    return out;
  }
  const snaps = await Promise.all(items.map((item) => item.ref.get()));
  const results = new Array(items.length);
  const toCheck = [];
  snaps.forEach((saved, idx) => {
    const data = saved.exists ? saved.data() : {};
    const record = { ...data, ...(items[idx].override || {}) };
    const trackingKey = record.trackingId || record.internetMessageId || "";
    const previous = data.outlook?.trackingKey === trackingKey ? data.outlook : null;
    if (previous?.checkedAt && Date.now() - millis(previous.checkedAt) < 60000) {
      results[idx] = previous;
    } else {
      toCheck.push({ idx, ref: items[idx].ref, record, trackingKey, previous });
    }
  });
  if (toCheck.length) {
    const checked = await check.checkBatch(toCheck.map((entry) => entry.record));
    await Promise.all(toCheck.map(async (entry, i) => {
      const result = { ...checked[i], trackingKey: entry.trackingKey };
      const durable = ["bounced", "delayed"].includes(entry.previous?.state) && !["bounced", "delayed"].includes(result.state)
        ? { ...entry.previous, checkedAt: result.checkedAt }
        : result;
      await entry.ref.set({ outlook: durable }, { merge: true });
      results[entry.idx] = durable;
    }));
  }
  return results;
}
