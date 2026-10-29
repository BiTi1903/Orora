export const mailActorLabel = (mail) => !mail.manual && mail.manual !== undefined ? "Tự động khi đặt hàng" : mail.actorName || mail.actorEmail || (mail.actor ? `Tài khoản ${mail.actor}` : "Chưa lưu tài khoản thao tác");
export function groupMailTemplates(mails) {
  const groups = new Map(); const byMail = new Map();
  const chronological = [...mails].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  for (const mail of chronological) {
    const original = typeof mail.templateSubject === "string" && typeof mail.templateText === "string";
    const message = { subject: original ? mail.templateSubject : mail.subject, text: original ? mail.templateText : mail.text };
    const key = JSON.stringify([original, message.subject, message.text]);
    if (!groups.has(key)) groups.set(key, { id: `template-${groups.size + 1}`, label: `Mẫu thư ${groups.size + 1}`, message, original, count: 0 });
    const group = groups.get(key); group.count++; byMail.set(mail.id, group);
  }
  return { templates: [...groups.values()], byMail };
}
