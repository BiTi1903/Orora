import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { addressProvinces, addressWards, resolveDeliveryAddress, createAddressesHandler } from "../server/addresses.js";
import { shippingFeeFor } from "../src/lib/shipping.js";
import { createOrderHandler } from "../server/orders.js";
import { renderOrderMessage, validateOrderTemplate } from "../server/order-mail.js";
import { hasOrderTokens } from "../src/lib/template-kinds.js";
import { memoryDb, response } from "./firestore-memory.js";
const env = { NEWSLETTER_SITE_ORIGIN: "https://orora.example" };
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, "content-type": "application/json" };
const body = () => ({ requestId: randomUUID(), productId: "serum", quantity: 2, name: "Buyer", email: "buyer@example.com", phone: "0900000000", provinceCode: "79", wardCode: "25747", addressDetail: "123 Đường thử nghiệm", paymentMethod: "bank_transfer", consent: true, expectedShippingFee: 15000 });
async function setup() {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  await db.collection("settings").doc("home").set({ shippingSettings: { enabled: true, freeAbove: null, provinces: { "79": { fee: 30000, wardFees: { "25747": 15000 } } } } });
  const handler = createOrderHandler({ getDb: () => db, env, sendMail: async () => {} });
  const call = async (data) => { const res = response(); await handler({ method: "POST", headers, body: data }, res); return res; };
  return { db, call };
}
test("address API uses 34 provinces and two-level wards with validated province membership", async () => {
  const provinces = await addressProvinces(); assert.equal(provinces.length, 34); assert.equal(new Set(provinces.map((item) => item.code)).size, 34);
  const wards = await addressWards("79"); assert.equal(wards.find((item) => item.code === "25747").provinceCode, "79");
  const address = await resolveDeliveryAddress({ ...body(), address: "Forged", provinceName: "Forged" });
  assert.match(address.address, /123 Đường thử nghiệm, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh/);
  await assert.rejects(resolveDeliveryAddress({ ...body(), provinceCode: "01" }), { status: 400 });
  await assert.rejects(addressWards("../../private"), { status: 400 });
  assert.equal(await resolveDeliveryAddress({ address: "Legacy address" }), null);
  const handler = createAddressesHandler(); const res = response(); await handler({ method: "GET", query: { provinceCode: "79" } }, res); assert.equal(res.statusCode, 200); assert.equal(res.body.items.length, wards.length);
  const bad = response(); await handler({ method: "POST" }, bad); assert.equal(bad.statusCode, 405);
});
test("fees distinguish unconfigured, free shipping, province defaults and ward overrides", () => {
  const settings = { enabled: true, provinces: { "79": { fee: 30000, wardFees: { "25747": 0, "26732": null } } } };
  assert.equal(shippingFeeFor(settings, "79", "25747").fee, 0);
  assert.equal(shippingFeeFor(settings, "79", "26732").fee, 30000);
  assert.equal(shippingFeeFor(settings, "01", "00004").fee, null);
  assert.equal(shippingFeeFor({}, "79", "25747").fee, null);
  assert.equal(shippingFeeFor({ enabled: true, provinces: { "79": { fee: "0" } } }, "79", "25747").fee, null);
});
test("orders snapshot canonical address and server-calculated fee/total; retries keep saved amounts after a fee edit", async () => {
  const { db, call } = await setup(); const data = body(); const result = await call({ ...data, shippingFee: 1, totalAmount: 1 });
  assert.equal(result.statusCode, 201); assert.equal(result.body.shippingFee, 15000); assert.equal(result.body.totalAmount, 515000);
  const saved = (await db.collection("orders").doc(data.requestId).get()).data(); assert.equal(saved.subtotal, 500000); assert.equal(saved.shippingFee, 15000); assert.equal(saved.customer.provinceCode, "79"); assert.equal(saved.customer.wardName, "Phường Thủ Dầu Một");
  await db.collection("settings").doc("home").set({ shippingSettings: { enabled: true, provinces: { "79": { fee: 50000 } } } });
  const retry = await call(data); assert.equal(retry.statusCode, 201); assert.equal(retry.body.code, result.body.code); assert.equal(retry.body.shippingFee, 15000);
  assert.equal((await db.collection("orders").get()).docs.length, 1);
});
test("changed fee, missing tariff and mismatched province reject orders without reserving stock", async () => {
  const { db, call } = await setup();
  assert.equal((await call({ ...body(), expectedShippingFee: 0 })).statusCode, 409);
  assert.equal((await call({ ...body(), provinceCode: "01" })).statusCode, 400);
  assert.equal((await call({ ...body(), provinceCode: "01", wardCode: "00004" })).statusCode, 400);
  assert.equal((await call({ ...body(), provinceCode: undefined, wardCode: undefined, addressDetail: undefined, address: "Legacy address" })).statusCode, 400);
  assert.equal((await db.collection("orders").get()).docs.length, 0); assert.equal((await db.collection("inventory").get()).docs.length, 0); assert.equal((await db.collection("orderCodePools").get()).docs.length, 0);
});
test("receipt templates can use shipping and grand total without altering previously saved content", () => {
  const template = validateOrderTemplate({ subject: "Đơn {{orderCode}}", text: "Phí {{shippingFee}}; tổng {{totalAmount}}" });
  assert.equal(hasOrderTokens(template), true);
  const message = renderOrderMessage(template, { code: "OW_1234B", customer: {}, product: {}, quantity: 2, subtotal: 500000, shippingFee: 15000, totalAmount: 515000, paymentMethod: "bank_transfer" });
  assert.match(message.text, /15\.000/); assert.match(message.text, /515\.000/);
});

test("hosted order uses ORORA free delivery above 400000, including the amount on the receipt",async()=>{
 const {db,call}=await setup();
 await db.collection("settings").doc("home").set({shippingSettings:{enabled:true,provinces:{"79":{fee:15000}}}});
 const data={...body(),expectedShippingFee:0};
 const res=await call(data);
 assert.equal(res.statusCode,201);assert.equal(res.body.totalAmount,500000);assert.equal(res.body.shippingFee,0);
});
