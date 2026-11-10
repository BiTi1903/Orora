import test from "node:test";
import assert from "node:assert/strict";
import { pageSeo } from "../src/lib/seo.js";
import { createSitemapHandler } from "../server/sitemap.js";
import { memoryDb, response } from "./firestore-memory.js";

test("product SEO uses its own canonical, description and breadcrumb without fabricated reviews", () => {
  const seo = pageSeo("/product/serum", {}, [{ id: "serum", name: "Serum ORORA", description: "Dưỡng da\n mỗi ngày", price: "250.000đ", image: "https://images.example/serum.jpg" }]);
  assert.equal(seo.url, "https://ororavn.com/product/serum-orora");
  assert.equal(seo.title, "Serum ORORA | ORORA VN");
  assert.equal(seo.description, "Dưỡng da mỗi ngày");
  const product = seo.structuredData["@graph"].find((entry) => entry["@type"] === "Product");
  assert.equal(product.offers.price, "250000");
  assert.equal(product.offers.priceCurrency, "VND");
  assert.equal(product.aggregateRating, undefined);
  assert.equal(product.offers.availability, undefined);
  const crumbs = seo.structuredData["@graph"].find((entry) => entry["@type"] === "BreadcrumbList");
  assert.deepEqual(crumbs.itemListElement.map((entry) => entry.name), ["Trang chủ", "Serum ORORA"]);
});

test("old section URLs canonicalize to the homepage; admin and hidden products are not indexed", () => {
  for (const path of ["/", "/san-pham", "/ve-orora", "/lien-he"]) {
    const seo = pageSeo(path);
    assert.equal(seo.url, "https://ororavn.com/");
    assert.ok(!seo.noindex);
  }
  assert.equal(pageSeo("/admin").noindex, true);
  assert.equal(pageSeo("/product/hidden", {}, [{ id: "hidden", active: false }]).noindex, true);
  const seo = pageSeo("/product/contact", {}, [{ id: "contact", name: "Sản phẩm", price: "Liên hệ", image: "javascript:alert(1)" }]);
  const product = seo.structuredData["@graph"].find((entry) => entry["@type"] === "Product");
  assert.equal(product.offers, undefined);
  assert.equal(product.image, undefined);
});

test("sitemap tracks published Firebase products and excludes hidden or sample routes", async () => {
  const db = memoryDb();
  await db.collection("products").doc("serum").set({ name: "Serum", active: true });
  await db.collection("products").doc("hidden").set({ name: "Hidden", active: false });
  const res = response(); res.end = res.send;
  await createSitemapHandler({ getDb: () => db })({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /https:\/\/ororavn.com\/product\/serum/);
  assert.ok(!res.body.includes("/san-pham"));
  assert.ok(!res.body.includes("/ve-orora"));
  assert.ok(!res.body.includes("/lien-he"));
  assert.ok(!res.body.includes("hidden"));
  assert.ok(!res.body.includes("first-story"));
  await db.collection("products").doc("serum").delete();
  const updated = response(); updated.end = updated.send;
  await createSitemapHandler({ getDb: () => db })({ method: "GET" }, updated);
  assert.ok(!updated.body.includes("/product/serum"));
});

test("sitemap errors are retryable and never return credentials", async () => {
  const res = response(); res.end = res.send;
  await createSitemapHandler({ getDb: () => { throw new Error("private_key=secret"); } })({ method: "GET" }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.ok(!res.body.includes("secret"));
});

test('product schema uses validated numeric VND prices and never invents manufacturer identity',()=>{
 for(const price of [409000,'409000','409.000đ']){
  const seo=pageSeo('/product/gel',{},[{id:'gel',name:'Gel',price}]);const product=seo.structuredData['@graph'].find(item=>item['@type']==='Product');assert.equal(product.offers.price,'409000');assert.equal(product.brand,undefined);
 }
 const seo=pageSeo('/product/gel',{},[{id:'gel',name:'Gel',price:'Liên hệ',brand:'Bodyplex'}]);const product=seo.structuredData['@graph'].find(item=>item['@type']==='Product');assert.equal(product.offers,undefined);assert.equal(product.brand.name,'Bodyplex');
});
