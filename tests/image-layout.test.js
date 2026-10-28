import test from "node:test";
import assert from "node:assert/strict";
import { mobileImageVars } from "../src/lib/image-layout.js";
import { toCss } from "../src/lib/typography.js";

test("mobile layout is independent of saved portrait desktop settings", () => {
  const layout = { height: 600, aspectRatio: "3 / 4", radius: 24 };
  const before = structuredClone(layout);
  const vars = mobileImageVars(layout);
  assert.equal(vars["--mobile-image-height"], "auto");
  assert.equal(vars["--mobile-image-aspect"], "1 / 1");
  assert.deepEqual(layout, before);
});

test("mobile overrides support portrait ratio, fixed height, zero radius and image fit", () => {
  const vars = mobileImageVars({ mobileAspectRatio: "3 / 4", mobileRadius: 0, mobileObjectFit: "contain" });
  assert.equal(vars["--mobile-image-aspect"], "3 / 4");
  assert.equal(vars["--mobile-image-radius"], "0px");
  assert.equal(vars["--mobile-image-fit"], "contain");
  assert.equal(mobileImageVars({ mobileHeight: 240 })["--mobile-image-height"], "240px");
  assert.equal(mobileImageVars({ mobileHeight: 240 })["--mobile-image-aspect"], "auto");
  assert.equal(mobileImageVars({ mobileAspectRatio: "invalid" })["--mobile-image-aspect"], "1 / 1");
});

test("explicit mobile typography is separate from desktop font size", () => {
  const style = { fontSize: 48, mobileFontSize: 18 };
  assert.equal(toCss(style, { responsive: false }).fontSize, "48px");
  assert.equal(toCss(style)["--mobile-font-size"], "18px");
  assert.equal(toCss({ fontSize: 48, mobileFontSize: 0 })["--mobile-font-size"], undefined);
});
