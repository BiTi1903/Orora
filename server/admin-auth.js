import { firebaseAuthFailure } from "./firebase-auth-error.js";

function envAdminSet(env, keys) {
  const result = new Set();
  for (const key of keys) {
    const raw = String(env?.[key] || "").trim();
    if (!raw) continue;
    for (const uid of raw.split(",").map((s) => s.trim()).filter(Boolean)) result.add(uid);
  }
  return result;
}

export async function requireAdmin(req, {
  verifyToken,
  getDb,
  env = process.env,
  envKeys = ["ORDER_ADMIN_UIDS", "NEWSLETTER_ADMIN_UIDS"],
  primaryEnvKey,
  deniedMessage = "Tài khoản này chưa được cấp quyền quản trị.",
  logAuthError,
} = {}) {
  const token = /^Bearer (.+)$/.exec(req.headers?.authorization || "")?.[1];
  let user;
  try {
    user = token ? await verifyToken(token) : null;
  } catch (error) {
    const failure = firebaseAuthFailure(error);
    logAuthError?.(failure, error);
    throw Object.assign(new Error(failure.message), { status: failure.status, code: failure.code, publicError: true });
  }
  if (!user) throw Object.assign(new Error("Vui lòng đăng nhập lại."), { status: 401, publicError: true });
  if (user.admin === true) return user;

  // If a scoped primary env key (e.g. ORDER_ADMIN_UIDS) is explicitly set, honor it first;
  // otherwise fall back to the shared envKeys list.
  const primarySet = primaryEnvKey ? envAdminSet(env, [primaryEnvKey]) : new Set();
  const envAdmins = primarySet.size ? primarySet : envAdminSet(env, envKeys);
  if (envAdmins.has(user.uid)) return user;

  if (typeof getDb === "function" && !primarySet.size) {
    try {
      const db = await getDb();
      const doc = await db.collection("adminUsers").doc(user.uid).get();
      if (doc?.exists) return user;
    } catch {
      // If Firestore check fails, fall through to denied error rather than leaking internal details.
    }
  }
  throw Object.assign(new Error(deniedMessage), { status: 403, publicError: true });
}
