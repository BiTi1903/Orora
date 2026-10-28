import test from "node:test";
import assert from "node:assert/strict";
import { builderDraftKey, readBuilderDraft, saveBuilderDraft } from "../src/admin/builder/drafts.js";
const sections = () => Object.fromEntries(["about", "hero", "collection", "productDetail", "features", "reviews", "newsletter", "footer", "ticker", "navbar", "philosophy"].map((name) => [name, { label: name }]));
const storage = () => { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

test("drafts round-trip editor state locally and stay separate per user", () => {
  const local = storage();
  const state = sections();
  const before = structuredClone(state);
  const key = builderDraftKey("user-a");
  saveBuilderDraft(local, key, state);
  assert.deepEqual(readBuilderDraft(local, key).sections, state);
  assert.deepEqual(state, before);
  assert.equal(readBuilderDraft(local, builderDraftKey("user-b")), null);
});

test("draft serialization excludes product samples and unrelated data", () => {
  const local = storage();
  const key = builderDraftKey();
  saveBuilderDraft(local, key, { ...sections(), sampleProducts: [{ name: "Sản phẩm mẫu" }], secret: "do-not-store" });
  assert.ok(!local.getItem(key).includes("Sản phẩm mẫu"));
  assert.ok(!local.getItem(key).includes("do-not-store"));
});

test("missing, corrupt or unsupported drafts cannot replace editor state", () => {
  const local = storage(); const key = builderDraftKey();
  assert.equal(readBuilderDraft(local, key), null);
  local.setItem(key, "invalid"); assert.throws(() => readBuilderDraft(local, key));
  local.setItem(key, JSON.stringify({ version: 2, sections: sections() })); assert.throws(() => readBuilderDraft(local, key));
  local.setItem(key, JSON.stringify({ version: 1, sections: {} })); assert.throws(() => readBuilderDraft(local, key));
});
