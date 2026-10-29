export const mailActorLabel = (mail) => !mail.manual && mail.manual !== undefined ? "Tự động khi đặt hàng" : mail.actorName || mail.actorEmail || (mail.actor ? `Tài khoản ${mail.actor}` : "Chưa lưu tài khoản thao tác");
export function groupMailTemplates(mails) {
  const groups = new Map(); const byMail = new Map();
  const chronological = [...mails].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  for (const mail of chronological) {
    const original = typeof mail.templateSubject === "string" && typeof mail.templateText === "string";
    const message = { subject: original ? mail.templateSubject : mail.subject, text: original ? mail.templateText : mail.text };
    const key = JSON.stringify([mail.templateId || "", mail.templateRevision || 0, mail.templateName || "", original, message.subject, message.text]);
    if (!groups.has(key)) groups.set(key, { id: `template-${groups.size + 1}`, label: mail.templateName ? `${mail.templateName}${mail.templateId && mail.templateRevision ? ` · v${mail.templateRevision}` : ""}` : `Bản gửi cũ · ${message.subject.slice(0, 65)}`, message, original, count: 0 });
    const group = groups.get(key); group.count++; byMail.set(mail.id, group);
  }
  return { templates: [...groups.values()], byMail };
}

export const TEMPLATE_KINDS = { general: "Thư riêng cho khách", order: "Đơn hàng gửi riêng", order_auto: "Xác nhận đơn tự động" };
export const templateReference = (item) => item.saved && item.id && item.revision ? { id: item.id, revision: item.revision } : undefined;
export function templateUsageLabel(item) {
  const revision = item.revision || 1;
  if (item.usedRevisions?.includes(revision)) return "Đã gửi · phiên bản hiện tại";
  if (item.sentCount > 0) return "Đã sửa · bản hiện tại chưa gửi";
  return item.usageTracked ? "Chưa gửi" : "Lịch sử cũ chưa lưu liên kết mẫu";
}
