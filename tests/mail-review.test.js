import test from "node:test";
import assert from "node:assert/strict";
import { memoryDb } from "./firestore-memory.js";
import { reviewRecord, reviewPage, checkReview } from "../server/mail-review.js";

test("review checks only the selected tracked mail and records its bounce", async () => {
  const db = memoryDb();
  const queue = db.collection("newsletterMailReview");
  const tracking = {trackingId:"a69e18dc-7dd4-41db-98fd-91a8883dc592"};
  const source = db.collection("newsletterSubscribers").doc("sample");
  await source.set({status:"active",welcomeTracking:tracking});
  await queue.doc("one").set(reviewRecord("welcome","buyer@example.com","accepted",tracking,source.path));
  await queue.doc("two").set(reviewRecord("store","shop@example.com","failed",{},source.path));
  let calls = 0;
  const check = async () => { calls++; return {state:"bounced",checkedAt:new Date().toISOString()}; };
  assert.deepEqual(await checkReview(db,"newsletter",["one","one"],check),{checked:1});
  assert.equal(calls,1);
  assert.equal((await source.get()).data().status,"bounced");
  const issues = await reviewPage(queue,{});
  assert.equal(issues.rows.length,2);
  assert.equal((await queue.doc("two").get()).data().outlook,undefined);
  await assert.rejects(checkReview(db,"newsletter",["bad/path"],check));
});
