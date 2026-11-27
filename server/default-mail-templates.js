import { validateMessage } from "./newsletter-content.js";
import { validateOrderTemplate } from "./order-mail.js";
import { normalizeTemplateKind } from "../src/lib/template-kinds.js";
import { BUILTIN_MAIL_PRESETS } from "../src/lib/mail-presets.js";
import { mailActor } from "./mail-actor.js";

export async function ensureDefaultMailTemplates(db, user) {
  const marker = db.collection("newsletterSettings").doc("libraryDefaultsSeed");
  return db.runTransaction(async (tx) => {
    const seed = await tx.get(marker);
    const previousSeededIds = seed.exists
      ? (Array.isArray(seed.data()?.seededIds)
          ? seed.data().seededIds
          : ["builtin-welcome", "builtin-order-confirmation"])
      : [];
    const pendingPresets = BUILTIN_MAIL_PRESETS.filter((preset) => !previousSeededIds.includes(preset.id));
    if (!pendingPresets.length) return [];

    const refs = pendingPresets.map((preset) => db.collection("newsletterTemplates").doc(preset.id));
    const [welcome, order, ...existing] = await tx.getAll(
      db.collection("newsletterSettings").doc("welcome"),
      db.collection("newsletterSettings").doc("orderConfirmation"),
      ...refs,
    );
    const linkedRefs = [welcome, order]
      .filter((source) => /^[a-zA-Z0-9_-]{1,100}$/.test(source.data()?.templateId || ""))
      .map((source) => db.collection("newsletterTemplates").doc(source.data().templateId));
    const linked = linkedRefs.length ? await tx.getAll(...linkedRefs) : [];

    const created = [];
    const now = new Date();
    pendingPresets.forEach((preset, index) => {
      let message;
      if (preset.id === "builtin-welcome" && welcome.exists) {
        message = validateMessage(welcome.data());
      } else if (preset.id === "builtin-order-confirmation" && order.exists) {
        message = validateOrderTemplate(order.data());
      } else {
        message = preset.kind === "welcome_auto" ? validateMessage(preset) : validateOrderTemplate(preset);
      }
      const alreadySaved = linked.some(
        (snapshot) =>
          snapshot.exists &&
          normalizeTemplateKind(snapshot.data().kind) === preset.kind &&
          snapshot.data().subject === message.subject &&
          snapshot.data().text === message.text,
      );
      if (existing[index].exists || alreadySaved) return;
      tx.set(refs[index], {
        name: preset.name,
        kind: preset.kind,
        ...message,
        ...(message.design ? { design: message.design } : {}),
        ...mailActor(user),
        revision: 1,
        usageTracked: false,
        sentCount: 0,
        usedRevisions: [],
        createdAt: now,
        updatedAt: now,
      });
      created.push(refs[index].id);
    });

    tx.set(
      marker,
      {
        seededAt: now,
        seededBy: user.uid,
        seededIds: [...new Set([...previousSeededIds, ...pendingPresets.map((p) => p.id)])],
      },
      { merge: true },
    );
    return created;
  });
}
