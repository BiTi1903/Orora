import test from "node:test";
import assert from "node:assert/strict";
import { hasOrderTokens } from "../src/lib/template-kinds.js";
import { productVolumeOptions, selectedVolumeOption, validateVolumeOptions, volumePriceText, orderProductName } from "../src/lib/product-options.js";

test("old products stay unchanged; one volume is automatic, multiple require a valid choice", () => {
  const legacy = { name: "Serum", size: "100 ml", price: "250.000đ" };
  assert.deepEqual(productVolumeOptions(legacy), []);
  const product = { ...legacy, volumeOptions: [{ id: "small", label: " 100 ml ", price: "" }, { id: "big", label: "200 ml", price: "400.000đ" }] };
  const before = structuredClone(product);
  const options = productVolumeOptions(product);
  assert.equal(selectedVolumeOption(options, ""), null);
  assert.equal(selectedVolumeOption(options, "removed"), null);
  assert.equal(selectedVolumeOption([options[0]], "")?.label, "100 ml");
  assert.equal(volumePriceText(product, options[0]), "250.000đ");
  assert.equal(volumePriceText(product, selectedVolumeOption(options, "big")), "400.000đ");
  assert.deepEqual(product, before);
});

test("volume configuration rejects ambiguous labels, invalid prices and IDs", () => {
  const small = { id: "small", label: "100 ml", price: "" };
  assert.equal(validateVolumeOptions([]), "");
  assert.equal(validateVolumeOptions([small]), "");
  assert.equal(validateVolumeOptions([{ ...small, price: "0" }]), "");
  for (const value of [null, {}, [small, { ...small, id: "other", label: "100ML" }], [small, { ...small, label: "200 ml" }], [{ ...small, label: " " }], [{ ...small, price: "-1" }], [{ ...small, price: "Liên hệ" }], [{ ...small, id: "bad/id" }], Array.from({ length: 31 }, (_, i) => ({ id: `id${i}`, label: `${i} ml` }))]) assert.ok(validateVolumeOptions(value));
  assert.deepEqual(productVolumeOptions({ volumeOptions: [{ ...small, price: "-1" }] }), []);
  assert.equal(orderProductName({ name: "Serum" }), "Serum");
  assert.equal(orderProductName({ name: "Serum", variantLabel: "200 ml" }), "Serum — 200 ml");
  assert.equal(hasOrderTokens({ text: "Dung tích: {{variantLabel}}" }), true);
});
