export function mailActor(user) {
  return { actor: user.uid, actorName: String(user.name || user.displayName || "").slice(0, 200), actorEmail: String(user.email || "").slice(0, 254) };
}
export async function resolveMailActors(mails, lookupUser) {
  const cache = new Map();
  return Promise.all(mails.map(async (mail) => {
    if (!mail.manual || mail.actorName || mail.actorEmail || !mail.actor || mail.actor === "automatic" || !lookupUser) return mail;
    if (!cache.has(mail.actor)) cache.set(mail.actor, Promise.resolve().then(() => lookupUser(mail.actor)).catch(() => null));
    const user = await cache.get(mail.actor);
    return user ? { ...mail, actorName: user.displayName || user.name || "", actorEmail: user.email || "" } : mail;
  }));
}
