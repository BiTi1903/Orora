import test from "node:test";
import assert from "node:assert/strict";
import { orderPaymentLabel, summarizeOrderCustomers } from "../src/lib/order-summary.js";

test("COD remains collect-on-delivery until paid; transfer starts unpaid", () => {
  assert.equal(orderPaymentLabel({ paymentMethod: "cod", paymentStatus: "unpaid" }), "Thanh toán khi nhận hàng (COD)");
  assert.equal(orderPaymentLabel({ paymentMethod: "bank_transfer", paymentStatus: "unpaid" }), "Chưa thanh toán");
  assert.equal(orderPaymentLabel({ paymentMethod: "cod", paymentStatus: "paid" }), "Đã thanh toán");
  assert.equal(orderPaymentLabel({ paymentMethod: "bank_transfer", paymentStatus: "paid" }), "Đã thanh toán");
});

test("customer totals normalize email and exclude cancelled orders and unknown prices without treating COD as paid", () => {
  const base = { customer: { name: "Khách", email: "Buyer@Example.com " }, status: "new", paymentStatus: "unpaid", paymentMethod: "cod", subtotal: 250000 };
  const orders = [base, { ...base, customer: { email: "buyer@example.com" }, subtotal: 500000, paymentStatus: "paid" }, { ...base, status: "cancelled", subtotal: 900000, paymentStatus: "paid" }, { ...base, subtotal: null }, { ...base, customer: { name: "Đơn cũ" } }];
  const before = structuredClone(orders);
  const result = summarizeOrderCustomers(orders);
  assert.deepEqual(result, { missingEmail: 1, customers: [{ email: "buyer@example.com", name: "Khách", orderCount: 4, cancelledCount: 1, total: 750000, paid: 500000, awaitingPayment: 250000, quoteCount: 1 }] });
  assert.deepEqual(orders, before);
});
