import { randomInt } from "node:crypto";
// Random draw without replacement: 10,000 distinct four-digit codes per suffix.
// This private pool never resets by day, so an old code is never reused.
export function allocateOrderCode(saved, paymentMethod, chooseIndex = (max) => randomInt(max)) {
  const suffix = paymentMethod === "cod" ? "C" : paymentMethod === "bank_transfer" ? "B" : null;
  if (!suffix) throw new Error("Invalid order code payment method");
  const remaining = saved?.remaining ?? 10000;
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > 10000) throw new Error("Invalid order code pool");
  if (!remaining) {
    const seq = saved?.overflowSeq ?? 10000;
    if (!Number.isSafeInteger(seq) || seq < 10000) throw new Error("Invalid order code overflow sequence");
    return { code: `OW_${seq}${suffix}`, pool: { remaining: 0, swaps: {}, overflowSeq: seq + 1 } };
  }
  const index = chooseIndex(remaining);
  if (!Number.isInteger(index) || index < 0 || index >= remaining) throw new Error("Invalid random order code index");
  const swaps = { ...(saved?.swaps || {}) };
  const number = swaps[index] ?? index;
  const last = swaps[remaining - 1] ?? remaining - 1;
  if (![number, last].every((value) => Number.isInteger(value) && value >= 0 && value < 10000)) throw new Error("Invalid order code pool values");
  if (index !== remaining - 1) swaps[index] = last;
  delete swaps[remaining - 1];
  return { code: `OW_${String(number).padStart(4, "0")}${suffix}`, pool: { remaining: remaining - 1, swaps } };
}
