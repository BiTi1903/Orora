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
