import { randomUUID } from "node:crypto";
export function newMailTracking(sender) {
  const trackingId = randomUUID();
  const domain = String(sender || "sales@ororavn.com").split("@")[1];
  return { trackingId, internetMessageId: `<${trackingId}@${/^[a-z0-9.-]+$/i.test(domain || "") ? domain : "ororavn.com"}>` };
}
export function safeMailTracking(value) {
  if (!value || !/^[a-f0-9-]{36}$/i.test(value.trackingId || "")) return {};
  return { trackingId: value.trackingId, transport: value.transport === "smtp" ? "smtp" : "graph", ...(typeof value.internetMessageId === "string" && /^<[^\s<>]{1,250}>$/.test(value.internetMessageId) ? { internetMessageId: value.internetMessageId } : {}) };
}
