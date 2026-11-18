export const STALE_SENDING_MS = 5 * 60 * 1000;

export function mailTimestampMs(value) {
  if (value == null || value === "") return NaN;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "object" && (value._seconds ?? value.seconds) != null) {
    return Number(value._seconds ?? value.seconds) * 1000;
  }
  return new Date(value).getTime();
}

export function effectiveMailState(mail, now = Date.now()) {
  if (!mail?.state) return "none";
  if (mail.state !== "sending") return mail.state;
  const t = mailTimestampMs(mail.updatedAt);
  return !Number.isFinite(t) || now - t > STALE_SENDING_MS ? "stuck" : "sending";
}
