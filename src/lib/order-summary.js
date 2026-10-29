import { PAYMENT_LABELS } from "./commerce.js";

export function orderPaymentLabel(order) {
  if (order.paymentStatus === "paid") return "Đã thanh toán";
  return order.paymentMethod === "cod" ? PAYMENT_LABELS.cod : "Chưa thanh toán";
}

// Totals are product subtotals, not revenue: shipping and cancelled orders are excluded.
export function summarizeOrderCustomers(orders) {
  const groups = new Map();
  let missingEmail = 0;
  for (const order of orders) {
    const email = String(order.customer?.email || "").trim().toLowerCase();
    if (!email) { missingEmail++; continue; }
    if (!groups.has(email)) groups.set(email, { email, name: order.customer?.name || "", orderCount: 0, cancelledCount: 0, total: 0, paid: 0, awaitingPayment: 0, quoteCount: 0 });
    const group = groups.get(email);
    group.orderCount++;
    if (order.status === "cancelled") { group.cancelledCount++; continue; }
    if (typeof order.subtotal !== "number" || !Number.isFinite(order.subtotal) || order.subtotal < 0) { group.quoteCount++; continue; }
    group.total += order.subtotal;
    if (order.paymentStatus === "paid") group.paid += order.subtotal;
    else group.awaitingPayment += order.subtotal;
  }
  return { customers: [...groups.values()].sort((a, b) => b.orderCount - a.orderCount || a.email.localeCompare(b.email)), missingEmail };
}
