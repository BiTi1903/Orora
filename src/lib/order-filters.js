export const EMPTY_ORDER_FILTERS = { min: "", max: "", from: "", to: "", payment: "all", method: "all", sort: "newest" };
export function invalidMoneyRange(min, max) {
  return (min !== "" && (!Number.isFinite(Number(min)) || Number(min) < 0)) || (max !== "" && (!Number.isFinite(Number(max)) || Number(max) < 0)) || (min !== "" && max !== "" && Number(min) > Number(max));
}
export function filterOrderDetails(orders, filters) {
  if (invalidMoneyRange(filters.min, filters.max) || (filters.from && filters.to && filters.from > filters.to)) return [];
  return orders.filter((order) => {
    const day = new Date(Number(order.createdAt || 0) + 7 * 3600000).toISOString().slice(0, 10);
    const amountKnown = typeof order.subtotal === "number" && Number.isFinite(order.subtotal);
    return (filters.payment === "all" || order.paymentStatus === filters.payment)
      && (filters.method === "all" || order.paymentMethod === filters.method)
      && (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to)
      && (filters.min === "" || (amountKnown && order.subtotal >= Number(filters.min)))
      && (filters.max === "" || (amountKnown && order.subtotal <= Number(filters.max)));
  }).sort((a, b) => {
    if (filters.sort === "amountAsc" || filters.sort === "amountDesc") {
      if (a.subtotal === null || a.subtotal === undefined) return b.subtotal == null ? 0 : 1;
      if (b.subtotal === null || b.subtotal === undefined) return -1;
      return (a.subtotal - b.subtotal) * (filters.sort === "amountAsc" ? 1 : -1);
    }
    return (Number(a.createdAt || 0) - Number(b.createdAt || 0)) * (filters.sort === "oldest" ? 1 : -1);
  });
}
