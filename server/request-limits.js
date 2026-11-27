import { createHmac } from 'node:crypto';

export function requestClientIp(req) {
  return String(req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim().slice(0, 160);
}

export const rateLimitSalt = (env) => env.CHAT_RATE_LIMIT_SALT?.trim() || env.FIREBASE_SERVICE_ACCOUNT_JSON || '';

export function rateLimitDocRef(db, req, { scope, salt, key }) {
  const hash = createHmac('sha256', salt).update(`${scope}:${key ?? requestClientIp(req)}`).digest('hex');
  return db.collection('chatRateLimits').doc(`${scope}-${hash}`);
}

export function evaluateRateLimit(prior, { cost, budget, now, windowMs = 60000 }) {
  const bucket = Math.floor(now / windowMs);
  // `minute` là chỉ số cửa sổ; giữ tên trường cũ cho các tài liệu đã có.
  const count = (prior?.minute === bucket ? prior.count || 0 : 0) + cost;
  if (count > budget) {
    return { wait: Math.ceil(((bucket + 1) * windowMs - now) / 1000), write: null };
  }
  return { wait: 0, write: { minute: bucket, count, expiresAt: new Date(now + Math.max(3600000, windowMs * 2)) } };
}

// Persistent per-client budgets shared by all instances of the public endpoint.
export async function reserveRequestBudget(db, req, options) {
  const ref = rateLimitDocRef(db, req, options);
  return db.runTransaction(async tx => {
    const { wait, write } = evaluateRateLimit((await tx.get(ref)).data(), options);
    if (wait) return wait;
    tx.set(ref, write);
    return 0;
  });
}

export async function reserveBudgetOrAllow(...args) {
  try { return await reserveRequestBudget(...args); }
  catch { console.error('Rate limit check failed'); return 0; }
}
