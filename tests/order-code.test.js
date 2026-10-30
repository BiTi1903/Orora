import test from "node:test";
import assert from "node:assert/strict";
import { allocateOrderCode } from "../server/order-code.js";
test("all 10,000 four-digit codes are unique without replacement even with a repeated random index", () => {
  let saved; const codes = new Set();
  for (let i = 0; i < 10000; i++) { const result = allocateOrderCode(saved, "cod", () => 0); assert.match(result.code, /^OW_\d{4}C$/); assert.ok(!codes.has(result.code)); codes.add(result.code); saved = result.pool; }
  assert.equal(codes.size, 10000); assert.equal(saved.remaining, 0); assert.deepEqual(saved.swaps, {});
  assert.throws(() => allocateOrderCode(saved, "cod"), { status: 503 });
});
test("random draws across the pool preserve uniqueness and reject invalid pool state", () => {
  let saved; const codes = new Set();
  for (let i = 0; i < 500; i++) { const result = allocateOrderCode(saved, "bank_transfer"); assert.match(result.code, /^OW_\d{4}B$/); assert.ok(!codes.has(result.code)); codes.add(result.code); saved = result.pool; }
  assert.throws(() => allocateOrderCode({ remaining: -1 }, "cod"));
  assert.throws(() => allocateOrderCode(undefined, "cod", () => 10000));
  assert.throws(() => allocateOrderCode(undefined, "invalid"));
});
