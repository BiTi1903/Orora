import { createHmac } from 'node:crypto';

export function requestClientIp(req) {
  return String(req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim().slice(0, 160);
}

export const rateLimitSalt = (env) => env.CHAT_RATE_LIMIT_SALT?.trim() || env.FIREBASE_SERVICE_ACCOUNT_JSON || '';

// Persistent per-client budgets shared by all instances of the public endpoint.
export async function reserveRequestBudget(db, req, { scope, cost, budget, now, salt, key, windowMs = 60000 }) {
  const bucket = Math.floor(now / windowMs);
  const hash = createHmac('sha256', salt).update(`${scope}:${key ?? requestClientIp(req)}`).digest('hex');
  const ref = db.collection('chatRateLimits').doc(`${scope}-${hash}`);
  return db.runTransaction(async tx => {
    const prior = (await tx.get(ref)).data();
    // `minute` là chỉ số cửa sổ; giữ tên trường cũ cho các tài liệu đã có.
    const count = (prior?.minute === bucket ? prior.count || 0 : 0) + cost;
    if (count > budget) return Math.ceil(((bucket + 1) * windowMs - now) / 1000);
    tx.set(ref, { minute: bucket, count, expiresAt: new Date(now + Math.max(3600000, windowMs * 2)) });
    return 0;
  });
}

export async function reserveBudgetOrAllow(...args) {
  try { return await reserveRequestBudget(...args); }
  catch { console.error('Rate limit check failed'); return 0; }
}
