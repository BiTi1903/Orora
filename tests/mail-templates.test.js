import test from "node:test";
import assert from "node:assert/strict";
import { groupMailTemplates, mailActorLabel } from "../src/lib/mail-templates.js";
import { resolveMailActors } from "../server/mail-actor.js";

test("personalized receipts share source templates while legacy content stays exact", () => {
  const source = { templateSubject: "Đơn {{orderCode}}", templateText: "Chào {{customerName}}" };
  const mails = [{ id: "2", createdAt: 2, ...source, subject: "Đơn B", text: "Chào Linh" }, { id: "1", createdAt: 1, ...source, subject: "Đơn A", text: "Chào Sales" }, { id: "3", createdAt: 3, subject: "Old", text: "Exact old body" }];
  const grouped = groupMailTemplates(mails);
  assert.equal(grouped.templates.length, 2); assert.equal(grouped.byMail.get("1"), grouped.byMail.get("2"));
  assert.equal(grouped.templates[0].count, 2); assert.equal(grouped.templates[0].message.text, source.templateText);
  assert.equal(grouped.templates[1].original, false); assert.equal(grouped.templates[1].message.text, "Exact old body");
});
test("actor names reflect real accounts; old UID profiles resolve once, automatic mail is never attributed to the viewer", async () => {
  let lookups = 0;
  const items = await resolveMailActors([{ manual: true, actor: "old" }, { manual: true, actor: "old" }, { manual: false, actor: "automatic" }, { manual: true, actor: "sales", actorName: "Sales", actorEmail: "sales@example.com" }], async () => { lookups++; return { displayName: "Linh", email: "linh@example.com" }; });
  assert.equal(lookups, 1); assert.equal(mailActorLabel(items[0]), "Linh"); assert.equal(mailActorLabel(items[2]), "Tự động khi đặt hàng"); assert.equal(mailActorLabel(items[3]), "Sales");
  const missing = await resolveMailActors([{ manual: true, actor: "deleted" }], async () => { throw Error("Not found"); });
  assert.match(mailActorLabel(missing[0]), /deleted/);
});
