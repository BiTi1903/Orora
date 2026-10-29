import test from "node:test";
import assert from "node:assert/strict";
import { contactLinks } from "../src/lib/contact.js";

test("contact actions use saved details and encode product names without altering source data", () => {
  const home = { footerPhone: "0901.234.567", footerEmail: "hello@example.com" };
  const before = structuredClone(home);
  const links = contactLinks(home, "Serum & dưỡng da");
  assert.equal(links.phone, "tel:0901234567");
  assert.equal(links.zalo, "https://zalo.me/0901234567");
  assert.equal(links.email, `mailto:hello@example.com?subject=${encodeURIComponent("Tư vấn về Serum & dưỡng da")}`);
  assert.deepEqual(home, before);
});

test("missing or invalid contact details never fall back to a hardcoded phone number", () => {
  assert.deepEqual(contactLinks(), { phone: null, zalo: null, email: null });
  assert.deepEqual(contactLinks({ footerPhone: "not a phone", footerEmail: "not email" }), { phone: null, zalo: null, email: null });
  assert.equal(contactLinks({ footerPhone: "+84 (901) 234-567" }).phone, "tel:+84901234567");
});

test("product contact overrides are isolated from footer data and reject unsafe Zalo URLs", () => {
  const home = { footerPhone: "0901234567", footerEmail: "hello@example.com" };
  const before = structuredClone(home);
  const links = contactLinks(home, "Serum", { phone: "0912 345 678", zaloUrl: "https://zalo.me/0987654321" });
  assert.equal(links.phone, "tel:0912345678");
  assert.equal(links.zalo, "https://zalo.me/0987654321");
  assert.deepEqual(home, before);
  for (const zaloUrl of ["javascript:alert(1)", "https://example.com", "https://zalo.me.evil.example/a", "https://name@zalo.me/a"]) {
    assert.equal(contactLinks(home, "", { zaloUrl }).zalo, null);
  }
  assert.equal(contactLinks(home, "", { phone: "", zaloUrl: "" }).phone, "tel:0901234567");
});
