import { createHmac } from 'node:crypto';

export function requestClientIp(req) {
  return String(req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim().slice(0, 160);
}

// Persistent per-client budgets shared by all instances of the public endpoint.
export async function reserveRequestBudget(db, req, { scope, cost, budget, now, salt }) {
  const minute = Math.floor(now / 60000);
  const hash = createHmac('sha256', salt).update(`${scope}:${requestClientIp(req)}`).digest('hex');
  const ref = db.collection('chatRateLimits').doc(`${scope}-${hash}`);
  return db.runTransaction(async tx => {
    const prior = (await tx.get(ref)).data();
    const count = (prior?.minute === minute ? prior.count || 0 : 0) + cost;
    if (count > budget) return Math.ceil(((minute + 1) * 60000 - now) / 1000);
    tx.set(ref, { minute, count, expiresAt: new Date(now + 3600000) });
    return 0;
  });
}
