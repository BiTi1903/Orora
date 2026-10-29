import { DEFAULT_WELCOME, validateMessage } from "./newsletter-content.js";
import { DEFAULT_ORDER_MESSAGE, validateOrderTemplate } from "./order-mail.js";
import { normalizeTemplateKind } from "../src/lib/template-kinds.js";
import { mailActor } from "./mail-actor.js";

export async function ensureDefaultMailTemplates(db, user) {
  const marker = db.collection("newsletterSettings").doc("libraryDefaultsSeed");
  return db.runTransaction(async (tx) => {
    const refs = [db.collection("newsletterTemplates").doc("builtin-welcome"), db.collection("newsletterTemplates").doc("builtin-order-confirmation")];
    const seed = await tx.get(marker);
    if (seed.exists) return [];
    const [welcome, order, ...existing] = await tx.getAll(db.collection("newsletterSettings").doc("welcome"), db.collection("newsletterSettings").doc("orderConfirmation"), ...refs);
    const sources = [welcome, order];
    const kinds = ["welcome_auto", "order_auto"];
    const linkedRefs = sources.filter((source) => /^[a-zA-Z0-9_-]{1,100}$/.test(source.data()?.templateId || "")).map((source) => db.collection("newsletterTemplates").doc(source.data().templateId));
    const linked = linkedRefs.length ? await tx.getAll(...linkedRefs) : [];
    const messages = [welcome.exists ? validateMessage(welcome.data()) : DEFAULT_WELCOME, order.exists ? validateOrderTemplate(order.data()) : DEFAULT_ORDER_MESSAGE];
    const created = []; const now = new Date();
    refs.forEach((ref, index) => {
      const message = messages[index];
      const alreadySaved = linked.some((snapshot) => snapshot.exists && normalizeTemplateKind(snapshot.data().kind) === kinds[index] && snapshot.data().subject === message.subject && snapshot.data().text === message.text);
      if (existing[index].exists || alreadySaved) return;
      tx.set(ref, { name: index === 0 ? "Chào mừng tự động có sẵn" : "Xác nhận đơn tự động có sẵn", kind: kinds[index], ...message, ...mailActor(user), revision: 1, usageTracked: false, sentCount: 0, usedRevisions: [], createdAt: now, updatedAt: now });
      created.push(ref.id);
    });
    tx.set(marker, { seededAt: now, seededBy: user.uid });
    return created;
  });
}
