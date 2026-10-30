import { randomInt } from "node:crypto";
// Random draw without replacement: 10,000 distinct four-digit codes per suffix.
// This private pool never resets by day, so an old code is never reused.
export function allocateOrderCode(saved, paymentMethod, chooseIndex = (max) => randomInt(max)) {
  const remaining = saved?.remaining ?? 10000;
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > 10000) throw new Error("Invalid order code pool");
  if (!remaining) throw Object.assign(new Error("Đã dùng hết mã đơn 4 số của phương thức này. Vui lòng liên hệ ORORA để đặt hàng."), { status: 503 });
  const index = chooseIndex(remaining);
  if (!Number.isInteger(index) || index < 0 || index >= remaining) throw new Error("Invalid random order code index");
  const swaps = { ...(saved?.swaps || {}) };
  const number = swaps[index] ?? index;
  const last = swaps[remaining - 1] ?? remaining - 1;
  if (![number, last].every((value) => Number.isInteger(value) && value >= 0 && value < 10000)) throw new Error("Invalid order code pool values");
  if (index !== remaining - 1) swaps[index] = last;
  delete swaps[remaining - 1];
  const suffix = paymentMethod === "cod" ? "C" : paymentMethod === "bank_transfer" ? "B" : null;
  if (!suffix) throw new Error("Invalid order code payment method");
  return { code: `OW_${String(number).padStart(4, "0")}${suffix}`, pool: { remaining: remaining - 1, swaps } };
}
