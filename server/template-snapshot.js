import { normalizeTemplateKind } from "../src/lib/template-kinds.js";
export const templateIdentity = (data = {}) => ({ templateId: data.templateId || "", templateRevision: data.templateRevision || 0, templateName: data.templateName || "", templateKind: data.templateKind || "" });
export async function captureTemplate(tx, db, reference, message, kind) {
  if (!reference) return {};
  if (typeof reference.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(reference.id) || !Number.isInteger(reference.revision) || reference.revision < 1) throw Object.assign(new Error("template_changed"), { status: 409 });
  const saved = await tx.get(db.collection("newsletterTemplates").doc(reference.id));
  const data = saved.data();
  if (!saved.exists || (data.revision || 1) !== reference.revision || normalizeTemplateKind(data.kind) !== normalizeTemplateKind(kind) || data.subject !== message.subject || data.text !== message.text) throw Object.assign(new Error("template_changed"), { status: 409 });
  return { templateId: saved.id, templateRevision: data.revision || 1, templateName: data.name, templateKind: normalizeTemplateKind(data.kind) };
}
export async function recordTemplateUse(tx, db, snapshot) {
  if (!snapshot?.templateId) return;
  const ref = db.collection("newsletterTemplates").doc(snapshot.templateId);
  const saved = await tx.get(ref);
  if (!saved.exists) return; // Never recreate a deleted template.
  const data = saved.data();
  tx.set(ref, { sentCount: (data.sentCount || 0) + 1, usedRevisions: [...new Set([...(data.usedRevisions || []), snapshot.templateRevision || 1])], lastSentAt: new Date() }, { merge: true });
}
