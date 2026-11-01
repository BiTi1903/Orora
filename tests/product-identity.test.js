import test from "node:test";
import assert from "node:assert/strict";
import { productNameSlug, productPublicId, productNumber, productPath, productSlug, withProductIdentity, findProductByRoute, nextProductSequence, matchesProductRoute } from "../src/lib/product-identity.js";
import { pageSeo } from "../src/lib/seo.js";

const catalog = [
  { id: "first-story", slug: "first-story", number: "01", name: "White Gel - Bodyplex", active: true },
  { id: "second-story", slug: "second-story", number: "02", name: "Dưỡng sáng & chăm sóc da", slugAliases: ["ten-cu"], active: true },
  { id: "hidden", number: "03", name: "Sản phẩm ẩn", active: false },
];
test("names generate safe canonical routes; numbers are public IDs, legacy keys and aliases still resolve", () => {
  const before = structuredClone(catalog);
  assert.equal(productNameSlug("  Dưỡng sáng & chăm sóc da!  "), "duong-sang-cham-soc-da");
  assert.equal(productPath(catalog[0], catalog), "/product/white-gel-bodyplex");
  assert.equal(productPublicId(catalog[0]), "1"); assert.equal(productNumber(catalog[0]), "01");
  for (const path of ["first-story", "white-gel-bodyplex", "1", "01"]) assert.equal(findProductByRoute(catalog, path).id, "first-story");
  assert.equal(findProductByRoute(catalog, "ten-cu").id, "second-story");
  for (const bad of ["", "../secrets", "bad\\path", "\0", null]) assert.equal(findProductByRoute(catalog, bad), null);
  assert.equal(matchesProductRoute(findProductByRoute(catalog, "first-story"), "white-gel-bodyplex"), true);
  assert.deepEqual(catalog, before);
});

test("duplicate names and legacy route collisions remain distinct, including hidden records", () => {
  const products = [{ id:"old",number:"1",name:"Serum" },{ id:"different",number:"2",name:"Serum" },{ id:"new",number:"3",name:"Old" }];
  const publicProducts = withProductIdentity(products);
  assert.equal(productSlug(publicProducts[0]), "serum-1"); assert.equal(productSlug(publicProducts[1]), "serum-2");
  assert.equal(productSlug(publicProducts[2]), "old-3");
  assert.equal(new Set(publicProducts.map(product=>productPath(product))).size,3);
  assert.equal(findProductByRoute(publicProducts,"serum-2").id,"different");
  assert.equal(findProductByRoute(publicProducts,"serum").id,"old");
  assert.equal(findProductByRoute(publicProducts,"old").id,"old");
  const withHidden = withProductIdentity([{ id:"hidden-alias",number:"1",name:"Other",slug:"serum",active:false },{id:"shown",number:"2",name:"Serum"}]);
  const filtered = withHidden.filter(product=>product.active!==false);
  assert.equal(pageSeo("/product/serum-2", {}, filtered).url, "https://ororavn.com/product/serum-2");
  assert.equal(pageSeo("/product/serum-2", {}, filtered).noindex, undefined);
});

test("new numeric keys advance beyond existing sequences and reservations, without recycling deleted IDs", () => {
  assert.equal(nextProductSequence(catalog), 4);
  assert.equal(nextProductSequence(catalog, 8), 9);
  assert.equal(nextProductSequence([{id:"10",number:"2"}]),11);
  assert.equal(nextProductSequence([]),1);
  const publicProducts=withProductIdentity([{id:"b",name:"No number B"},{id:"a",name:"No number A"}]);
  assert.deepEqual(publicProducts.map(p=>p.publicId),["1","2"]);
  assert.equal(productPublicId(publicProducts[0]),"1");
  assert.throws(()=>nextProductSequence([],999999999));
});
