import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_ORDER_FILTERS, filterOrderDetails, invalidMoneyRange } from "../src/lib/order-filters.js";
const orders = [
  { id: "a", subtotal: 100000, paymentStatus: "unpaid", paymentMethod: "cod", createdAt: Date.parse("2026-10-29T18:00:00Z") },
  { id: "b", subtotal: 500000, paymentStatus: "paid", paymentMethod: "bank_transfer", createdAt: Date.parse("2026-10-29T10:00:00Z") },
  { id: "c", subtotal: null, paymentStatus: "unpaid", paymentMethod: "cod", createdAt: Date.parse("2026-10-28T10:00:00Z") },
];
test("order filters combine inclusive money, Vietnam date and payment criteria without modifying records", () => {
  const before = structuredClone(orders);
  assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, min: "100000", max: "100000", from: "2026-10-30", to: "2026-10-30", payment: "unpaid", method: "cod" }).map((order) => order.id), ["a"]);
  assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, payment: "paid" }).map((order) => order.id), ["b"]);
  assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, min: "0" }).map((order) => order.id), ["a", "b"]);
  assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, sort: "amountDesc" }).map((order) => order.id), ["b", "a", "c"]);
  assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, sort: "amountAsc" }).map((order) => order.id), ["a", "b", "c"]);
  assert.deepEqual(orders, before);
});
test("invalid money or date ranges never silently return unfiltered orders", () => {
  for (const [min, max] of [["-1", ""], ["no", ""], ["500", "100"]]) {
    assert.equal(invalidMoneyRange(min, max), true);
    assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, min, max }), []);
  }
  assert.deepEqual(filterOrderDetails(orders, { ...EMPTY_ORDER_FILTERS, from: "2026-11-01", to: "2026-10-01" }), []);
});
