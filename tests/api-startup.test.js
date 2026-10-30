import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Reproduce runtimes/loaders that cannot require an ES module from CommonJS.
// Exercise real Firebase Admin imports, not the service doubles used by unit tests.
test("Vercel API entrypoints start without CommonJS-to-ESM require support", () => {
  const script = `
    const results = [];
    for (const [path, expected, req] of [
      ["./api/newsletter.js", 401, {method: "GET", headers: {}}],
      ["./api/subscribe.js", 405, {method: "GET", headers: {}}],
      ["./api/unsubscribe.js", 400, {method: "POST", query: {}}],
      ["./api/sitemap.js", 405, {method: "POST", headers: {}}],
      ["./api/orders.js", 405, {method: "GET", headers: {}}],
      ["./api/addresses.js", 405, {method: "POST", headers: {}}],
      ["./api/inventory.js", 405, {method: "DELETE", headers: {}}],
      ["./api/admin-orders.js", 405, {method: "DELETE", headers: {}}],
    ]) {
      const {default: handler} = await import(path);
      const res = {
        code: 200,
        setHeader() {},
        status(code) { this.code = code; return this; },
        json() { return this; },
        send() { return this; },
        end() { return this; },
      };
      await handler(req, res);
      if (res.code !== expected) throw new Error(path + ": unexpected status " + res.code);
      results.push({path, status: res.code});
    }
    console.log(JSON.stringify(results));
  `;
  const child = spawnSync(process.execPath, ["--no-experimental-require-module", "--input-type=module", "-e", script], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, NEWSLETTER_ADMIN_UIDS: "startup-test-admin" },
    encoding: "utf8",
    timeout: 15000,
  });
  assert.equal(child.status, 0, child.stderr || child.error?.message);
  assert.deepEqual(JSON.parse(child.stdout).map((item) => item.status), [401, 405, 400, 405, 405, 405, 405, 405]);
});
