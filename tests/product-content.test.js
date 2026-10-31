import test from "node:test";
import assert from "node:assert/strict";
import { productSections, secondaryProductImages, productImages, formatProductList, continueProductList, parseProductContent } from "../src/lib/product-content.js";

test("legacy product content is read losslessly, without modifying saved fields; explicit sections never revive deleted legacy text", () => {
  const old = { description: "Mô tả\nngắn", story: "  Câu chuyện\r\nDòng 2\n", material: "Thành phần: A • B", size: "40ml", color: "Hồng", origin: "Nhật Bản", image: "main.jpg", image2: "one.jpg", image3: "", image4: "four.jpg", image5: "five.jpg", image6: "six.jpg" };
  const snapshot = structuredClone(old); const sections = productSections(old);
  assert.equal(sections.length, 5); assert.equal(sections[0].content, old.story); assert.equal(sections[1].content, old.material); assert.deepEqual(old, snapshot);
  assert.equal(productSections(old, { material: "Thành phần" })[1].title, "Thành phần");
  assert.equal(old.material, snapshot.material);
  const saved = { ...old, detailSections: structuredClone(sections), additionalImages: secondaryProductImages(old) };
  assert.deepEqual(productSections(saved).map(s => s.content), [old.story, old.material, old.size, old.color, old.origin]);
  assert.deepEqual(productImages(saved), productImages(old)); assert.equal(saved.description, old.description);
  assert.deepEqual(productSections({ ...saved, detailSections: [] }), []); assert.deepEqual(secondaryProductImages({ ...saved, additionalImages: [] }), []);
  assert.deepEqual(productImages({ ...saved, additionalImages: ["a", "b", "c", "d", "e", "f", "g"] }), ["main.jpg", "a", "b", "c", "d", "e", "f", "g"]);
});
test("list toolbar transforms only selected lines, toggles markers and keeps surrounding paragraphs", () => {
  const text = "Đầu\nMột\nHai\nCuối";
  const result = formatProductList(text, 4, 11, "bullet"); assert.equal(result.text, "Đầu\n• Một\n• Hai\nCuối");
  assert.equal(formatProductList(result.text, result.start, result.end, "bullet").text, text);
  assert.equal(formatProductList(result.text, result.start, result.end, "number").text, "Đầu\n1. Một\n2. Hai\nCuối");
  assert.equal(formatProductList("", 0, 0, "dash").text, "- ");
  assert.equal(formatProductList("\nText", 0, 0, "bullet").text, "• \nText");
  assert.equal(formatProductList("Một\nHai", 0, 4, "dash").text, "- Một\nHai");
});
test("Enter continues bullets and numbers, exits an empty bullet and preserves text after cursor", () => {
  assert.deepEqual(continueProductList("• Một", 5), { text: "• Một\n• ", cursor: 8 });
  assert.deepEqual(continueProductList("3. Ba", 5), { text: "3. Ba\n4. ", cursor: 9 });
  assert.deepEqual(continueProductList("- Một\n- ", 8), { text: "- Một\n", cursor: 6 });
  assert.equal(continueProductList("Bình thường", 4), null);
  assert.equal(continueProductList("- Nội dung", 2).text, "- \n- Nội dung");
  assert.equal(continueProductList("- Một Hai", 5).text, "- Một\n-  Hai");
});
test("storefront content parses paragraphs, dash/bullet/number lists, CRLF and literal HTML safely", () => {
  const blocks = parseProductContent("Chào\r\nbạn\r\n- A\r\n- B\r\n• C\r\n2. Hai\r\n4. Bốn\r\n<img src=x onerror=alert(1)>");
  assert.deepEqual(blocks.map(b=>b.type), ["text", "dash", "bullet", "number", "text"]);
  assert.deepEqual(blocks[0].lines, [{text:"Chào"},{text:"bạn"}]);
  assert.deepEqual(blocks[3].lines, [{text:"Hai",number:2},{text:"Bốn",number:4}]);
  assert.equal(blocks[4].lines[0].text, "<img src=x onerror=alert(1)>");
});

test("three information groups preserve legacy and custom content and honor manual grouping", async () => {
  const { groupedProductSections, productSectionGroup } = await import("../src/lib/product-content.js");
  const old = { story: "Old story\nSecond line", material: "A, B", size: "40ml", origin: "Japan" };
  const before = structuredClone(old); const groups = groupedProductSections(productSections(old));
  assert.equal(groups.description[0].content, old.story); assert.equal(groups.specifications.length, 3); assert.equal(groups.usage.length, 0); assert.deepEqual(old, before);
  assert.equal(productSectionGroup({ title: "HƯỚNG DẪN SỬ DỤNG", content: "Instructions" }), "usage");
  assert.equal(productSectionGroup({ title: "Công dụng" }, 3), "description");
  assert.equal(productSectionGroup({ title: "Hướng dẫn", group: "specifications" }), "specifications");
  const item = { id: "custom", title: "Custom title", content: "Exact\r\n  text", group: "usage" }; assert.deepEqual(groupedProductSections([item]).usage, [item]);
  assert.deepEqual(groupedProductSections([{title:"Empty",content:" "}]), {description:[],specifications:[],usage:[]});
});
test("manually entered demo reviews are not published by default and only complete enabled entries render", async () => {
  const { publishedProductReviews } = await import("../src/lib/product-content.js");
  const product = { productReviews: [{id:"draft",name:"Demo",text:"Example",rating:5,published:false},{id:"complete",name:"Demo",text:"Example",rating:8,published:true},{id:"empty",name:"",text:"Example",published:true}] };
  const before = structuredClone(product); const rendered = publishedProductReviews(product); assert.equal(rendered.length,1); assert.equal(rendered[0].id,"complete"); assert.equal(rendered[0].rating,5); assert.deepEqual(product,before);
});

test("compact related rail excludes the current product, hidden/duplicate entries and prioritizes its category", async () => {
  const { compactRelatedProducts } = await import("../src/lib/product-content.js");
  const current = { id: "current", slug: "current-slug", categoryId: "skin" };
  const items = [{ id:"current",name:"Current" },{ id:"alias",slug:"current-slug",name:"Same product" },{id:"hidden",name:"Hidden",active:false},{id:"other",name:"Other",categoryId:"body"},{id:"same",name:"Same category",categoryId:"skin"},{id:"same",name:"Duplicate"},{id:"third",name:"Third"},{id:"fourth",name:"Fourth"},{id:"fifth",name:"Fifth"}];
  const before=structuredClone(items);assert.deepEqual(compactRelatedProducts(items,current).map(p=>p.id),["same","other","third","fourth"]);assert.deepEqual(items,before);assert.deepEqual(compactRelatedProducts(items.slice(0,3),current),[]);
});
