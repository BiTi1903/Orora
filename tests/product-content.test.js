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

test("related rail follows product sequence, wraps and skips current, hidden and duplicate entries", async () => {
  const { compactRelatedProducts } = await import("../src/lib/product-content.js");
  const items = Array.from({ length: 8 }, (_, index) => ({ id: `p${index + 1}`, number: String(index + 1), name: `Sản phẩm ${index + 1}`, categoryId: index % 2 ? "other" : "skin" }));
  const before = structuredClone(items);
  assert.deepEqual(compactRelatedProducts(items, items[4]).map(p=>p.id), ["p6","p7","p8","p1"]);
  assert.deepEqual(compactRelatedProducts(items, items[7]).map(p=>p.id), ["p1","p2","p3","p4"]);
  assert.deepEqual(compactRelatedProducts([items[0]],items[0]), []);
  const mixed = [...items].reverse(); mixed.push({ ...items[5] },{ id:"hidden",number:"6",name:"Ẩn",active:false });
  assert.deepEqual(compactRelatedProducts(mixed,items[4]).map(p=>p.id), ["p6","p7","p8","p1"]);
  assert.deepEqual(items,before);
});

test("Facebook follow links require HTTPS Facebook destinations and exclude Messenger and lookalike hosts", async () => {
  const { facebookFollowUrl } = await import("../src/lib/commerce.js");
  assert.equal(facebookFollowUrl("https://www.facebook.com/orora"), "https://www.facebook.com/orora");
  assert.equal(facebookFollowUrl("https://fb.me/orora"), "https://fb.me/orora");
  for (const value of ["javascript:alert(1)", "http://facebook.com/orora", "https://facebook.com.evil.example/orora", "https://m.me/orora", "https://user:password@facebook.com/orora"]) assert.equal(facebookFollowUrl(value), null);
});

test("compact purchase labels retain custom copy and do not rewrite saved settings", async () => {
  const { purchaseChannelLabels } = await import("../src/lib/commerce.js");
  const saved = { facebookLabel: "Đặt tại Facebook", tiktokLabel: "Mua trên TikTok", websiteLabel: "Đặt hàng ngay" };
  const before = structuredClone(saved);
  assert.deepEqual(purchaseChannelLabels(saved), { dividerLabel: "hoặc đặt hàng tại", facebookLabel: "Fb", tiktokLabel: "Tiktok" });
  assert.deepEqual(saved, before);
  assert.deepEqual(purchaseChannelLabels({ dividerLabel: "hoặc", facebookLabel: "Fanpage", tiktokLabel: "Shop" }), { dividerLabel: "hoặc", facebookLabel: "Fanpage", tiktokLabel: "Shop" });
});


test("custom social button labels can reuse old text without changing the other platform default", async () => {
  const { purchaseChannelLabels } = await import("../src/lib/commerce.js");
  assert.deepEqual(purchaseChannelLabels({ facebookLabel: "Đặt tại Facebook", customFacebookLabel: true, tiktokLabel: "Đặt tại TikTok" }), { dividerLabel: "hoặc đặt hàng tại", facebookLabel: "Đặt tại Facebook", tiktokLabel: "Tiktok" });
});

test('inline formatting selects and toggles words and preserves multiline lists',async()=>{
  const {formatProductInline,parseProductInline}=await import('../src/lib/product-content.js');
  const result=formatProductInline('Da dịu nhẹ',3,10,'b');
  assert.equal(result.text,'Da [b]dịu nhẹ[/b]');
  assert.equal(formatProductInline(result.text,result.start,result.end,'b').text,'Da dịu nhẹ');
  const list='- Dịu nhẹ\n- An toàn';
  const formatted=formatProductInline(list,0,list.length,'i');
  assert.equal(formatted.text,'- [i]Dịu nhẹ[/i]\n- [i]An toàn[/i]');
  assert.equal(parseProductContent(formatted.text)[0].type,'dash');
  assert.equal(formatProductInline(formatted.text,formatted.start,formatted.end,'i').text,list);
  assert.deepEqual(parseProductInline('[b]Da [i]dịu[/i][/b]'),[{mark:'b',children:['Da ',{mark:'i',children:['dịu']}]}]);
  assert.deepEqual(parseProductInline('<script>alert(1)</script>'),['<script>alert(1)</script>']);
});

test("productInformationBlocks ignores legacy text fields and groupedProductSections honors block/caption toggles", async () => {
  const { productInformationBlocks, groupedProductSections } = await import("../src/lib/product-content.js");
  const product = {
    story: "Nội dung cũ",
    material: "Thành phần cũ",
    detailSections: [
      { id: "old", group: "description", content: "Text cũ không có ảnh hay effect" },
      { id: "b1", group: "description", enabled: true, showText: true, image: "/a.jpg", content: "Chú thích 1", effect: "fade" },
      { id: "b2", group: "description", enabled: false, showText: true, image: "/b.jpg", content: "Đang tắt khối", effect: "rise" },
      { id: "b3", group: "specifications", enabled: true, showText: false, image: "/c.jpg", content: "Chú thích đang tắt", effect: "fade" },
      { id: "b4", group: "usage", enabled: true, showText: false, image: "", content: "Chỉ có chữ nhưng tắt chú thích", effect: "fade" },
    ],
  };
  const blocks = productInformationBlocks(product);
  assert.deepEqual(blocks.map((b) => b.id), ["b1", "b2", "b3", "b4"]);
  const groups = groupedProductSections(blocks);
  assert.deepEqual(groups.description.map((b) => b.id), ["b1"]);
  assert.deepEqual(groups.specifications.map((b) => b.id), ["b3"]);
  assert.deepEqual(groups.usage, []);
});

test("informationTabSettings normalizes frame, caption, skeleton shimmer and motion settings safely", async () => {
  const { informationTabSettings, informationMediaShadow } = await import("../src/lib/product-information.js");
  const defaults = informationTabSettings();
  assert.equal(defaults.imageRatio, "3 / 2");
  assert.equal(defaults.imageFit, "cover");
  assert.equal(defaults.imageRadius, 14);
  assert.equal(defaults.skeletonEffect, "shimmer");
  assert.equal(defaults.tabTransition, "slide-up");
  assert.equal(defaults.revealEffect, "rise");
  assert.equal(defaults.motionDuration, 450);

  const custom = informationTabSettings({
    imageRatio: "16 / 9",
    imageFit: "contain",
    imageRadius: 99,
    imageBorderWidth: -5,
    imageShadow: "elevated",
    blockGap: 32,
    captionAlign: "center",
    skeletonEffect: "pulse",
    tabTransition: "zoom",
    revealEffect: "fade",
    motionDuration: 260,
  });
  assert.equal(custom.imageRatio, "16 / 9");
  assert.equal(custom.imageFit, "contain");
  assert.equal(custom.imageRadius, 36);
  assert.equal(custom.imageBorderWidth, 0);
  assert.equal(custom.blockGap, 32);
  assert.equal(custom.captionAlign, "center");
  assert.equal(custom.skeletonEffect, "pulse");
  assert.equal(custom.tabTransition, "zoom");
  assert.equal(custom.revealEffect, "fade");
  assert.equal(custom.motionDuration, 260);
  assert.ok(informationMediaShadow(custom.imageShadow).includes("rgba"));
});

