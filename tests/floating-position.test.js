import test from "node:test";
import assert from "node:assert/strict";
import { clampFloatingPosition } from "../src/lib/floating-position.js";

test("dragging remains inside all four visible edges", () => {
  const view = { width: 390, height: 844 };
  const size = { width: 52, height: 52 };
  assert.deepEqual(clampFloatingPosition({ x: -200, y: -20 }, view, size), { x: 12, y: 12 });
  assert.deepEqual(clampFloatingPosition({ x: 900, y: 1000 }, view, size), { x: 326, y: 780 });
  assert.deepEqual(clampFloatingPosition({ x: 130, y: 400 }, view, size), { x: 130, y: 400 });
});

test("position is reclamped after rotation or a visual viewport offset", () => {
  assert.deepEqual(clampFloatingPosition({ x: 326, y: 780 }, { width: 320, height: 568 }, { width: 52, height: 52 }), { x: 256, y: 504 });
  assert.deepEqual(clampFloatingPosition({ x: 0, y: 0 }, { width: 320, height: 400, offsetLeft: 30, offsetTop: 50 }, { width: 52, height: 52 }), { x: 42, y: 62 });
});
