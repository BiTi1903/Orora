import test from "node:test";
import assert from "node:assert/strict";
import { formatProductPrice, formatVnd, priceInputValue, sameVndPrice } from "../src/lib/commerce.js";

test("plain and legacy prices display one consistent đ suffix without changing their stored values", () => {
  const values = [250000, "250000", "250.000đ", "250,000 VND", "250.000 ₫"];
  const before = structuredClone(values);
  for (const value of values) assert.equal(formatProductPrice(value), "250.000 đ");
  assert.equal(formatVnd(1225000), "1.225.000 đ");
  assert.equal(formatProductPrice(0), "0 đ");
  assert.equal(formatProductPrice("Liên hệ"), "Liên hệ");
  assert.equal(formatProductPrice(undefined), "");
  assert.deepEqual(values, before);
});

test("admin numeric input supports existing formatted values and preserves quote-style prices outside the input", () => {
  assert.equal(priceInputValue("250.000đ"), "250000");
  assert.equal(priceInputValue(250000), "250000");
  assert.equal(priceInputValue("0"), "0");
  assert.equal(priceInputValue(""), "");
  assert.equal(priceInputValue("Liên hệ"), "");
  assert.equal(sameVndPrice("250.000 đ", "250000"), true);
  assert.equal(sameVndPrice("250000", 250001), false);
  assert.equal(sameVndPrice("wrong", 250000), false);
  assert.equal(sameVndPrice("Liên hệ", "Liên hệ"), true);
  assert.equal(sameVndPrice("Liên hệ", ""), false);
});
