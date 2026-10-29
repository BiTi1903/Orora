import test from "node:test";
import assert from "node:assert/strict";
import { editedSectionPayload } from "../src/admin/builder/save-sections.js";

test("saving contact settings cannot overwrite hero, footer or other sections", () => {
  const payload = { heroTitle: "Default", footerPhone: "Default", productDetailStyles: { contactActions: { zaloLabel: "Hỏi" } }, detailLabels: { material: "Thành phần" } };
  assert.deepEqual(editedSectionPayload(payload, new Set(["productdetail"])), { productDetailStyles: payload.productDetailStyles, detailLabels: payload.detailLabels });
});

test("hero uses the live mobile image key and preserves intentionally empty values", () => {
  const payload = { heroImageMobile: "/mobile.jpg", heroMobileImage: "/old.jpg", heroRotator: [], heroTitle: "", footerLogo: "Unrelated" };
  assert.deepEqual(editedSectionPayload(payload, ["hero"]), { heroImageMobile: "/mobile.jpg", heroRotator: [], heroTitle: "" });
  assert.deepEqual(editedSectionPayload(payload, []), {});
});

test("multiple edited sections save together, without undefined or unknown fields", () => {
  const payload = { marqueeWords: [], marqueeStyles: {}, navLogo: "", navLinks: [], navStyles: undefined, unrelated: "value" };
  assert.deepEqual(editedSectionPayload(payload, ["ticker", "navbar", "unknown"]), { marqueeWords: [], marqueeStyles: {}, navLogo: "", navLinks: [] });
});

test("nested edits write only changed leaves, not template defaults or unrelated settings", async () => {
  const { changedValues, mergeSavedValues } = await import("../src/admin/builder/save-sections.js");
  const baseline = { heroTitle: "ORORA", heroImage: "/template.jpg", productDetailStyles: { contactActions: { zaloLabel: "Tư vấn", phone: "" }, name: { fontSize: 40 } } };
  const edited = structuredClone(baseline);
  edited.productDetailStyles.contactActions.zaloLabel = "Hỏi ORORA";
  const patch = changedValues(baseline, editedSectionPayload(edited, ["productdetail"]));
  assert.deepEqual(patch, { productDetailStyles: { contactActions: { zaloLabel: "Hỏi ORORA" } } });
  assert.deepEqual(mergeSavedValues(baseline, patch), edited);
  assert.deepEqual(changedValues(edited, edited), {});
});

test("explicit list clearing and zero values are saved without discarding other fields", async () => {
  const { changedValues } = await import("../src/admin/builder/save-sections.js");
  assert.deepEqual(changedValues({ marqueeWords: ["old"], styles: { radius: 20 } }, { marqueeWords: [], styles: { radius: 0 } }), { marqueeWords: [], styles: { radius: 0 } });
});
