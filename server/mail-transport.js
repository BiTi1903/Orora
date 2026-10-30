export function mailTransport(env = process.env) {
  return String(env.MS_MAIL_TRANSPORT || "").trim().toLowerCase() || "smtp";
}
