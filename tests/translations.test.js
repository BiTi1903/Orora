import test from "node:test";
import assert from "node:assert/strict";
import { publicHomeShell } from "../src/lib/home-shell.js";
import { translationRows, applySheet } from "../src/lib/translation-rows.js";

test("publicHomeShell keeps shell translationSheet entries, translations, and phraseOverrides", () => {
  const heroKey = JSON.stringify(["home", "heroTitle"]);
  const navKey = JSON.stringify(["home", "navLinks", 0, "label"]);
  const faqKey = JSON.stringify(["home", "productFaq", "items", "@abc", "title"]);
  const { content } = publicHomeShell({
    heroTitle: "ORORA",
    navLinks: [{ label: "Sản phẩm", href: "#collection" }],
    translations: { en: { heroTitle: "ORORA EN" } },
    phraseOverrides: { '"Mua ngay"': { vi: "Mua ngay", en: "Buy now", ja: "今すぐ購入" } },
    translationSheet: {
      [heroKey]: { vi: "ORORA", en: "ORORA Glow", ja: "ORORA" },
      [navKey]: { vi: "Sản phẩm", en: "Products", ja: "製品" },
      [faqKey]: { vi: "Câu hỏi", en: "Question", ja: "質問" },
    },
  });

  assert.deepEqual(content.translations, { en: { heroTitle: "ORORA EN" } });
  assert.ok(content.phraseOverrides['"Mua ngay"']);
  assert.equal(content.translationSheet[heroKey].en, "ORORA Glow");
  assert.equal(content.translationSheet[navKey].ja, "製品");
  assert.equal(content.translationSheet[faqKey], undefined);
});

test("translationRows humanizes breadcrumbs in Vietnamese while preserving row.key", () => {
  const rows = translationRows("home", {
    productDetailStyles: {
      purchaseOptions: {
        formLabels: {
          addressPlaceholder: "Số nhà, tên đường",
        },
      },
    },
    productFaq: {
      items: [{ id: "abc-123", title: "Giao hàng mất bao lâu?" }],
    },
  });

  const addr = rows.find(r => r.vi === "Số nhà, tên đường");
  assert.ok(addr);
  assert.equal(addr.key, JSON.stringify(["home", "productDetailStyles", "purchaseOptions", "formLabels", "addressPlaceholder"]));
  assert.equal(addr.where, "Trang chủ › Trang sản phẩm › Tùy chọn mua hàng › Form đặt hàng › Gợi ý địa chỉ");

  const faq = rows.find(r => r.vi === "Giao hàng mất bao lâu?");
  assert.ok(faq);
  assert.equal(faq.key, JSON.stringify(["home", "productFaq", "items", "@abc-123", "title"]));
  assert.equal(faq.where, "Trang chủ › FAQ sản phẩm › Câu hỏi #1 › Tiêu đề");
  assert.ok(!faq.where.includes("@abc-123"));
});

test("translationRows and applySheet support productCategories", () => {
  const catKey = JSON.stringify(["categories", "items", "@cat-1", "name"]);
  const docData = {
    items: [
      { id: "cat-1", name: "Dưỡng môi cao cấp" },
      { id: "cat-2", name: "Quà tặng" },
    ],
    translationSheet: {
      [catKey]: { vi: "Dưỡng môi cao cấp", en: "Luxury Lip Care", ja: "プレミアムリップケア" },
    },
  };

  const rows = translationRows("categories", docData);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].key, catKey);
  assert.equal(rows[0].where, "Danh mục sản phẩm › Danh mục #1 › Tên danh mục");
  assert.equal(rows[0].en, "Luxury Lip Care");
  assert.equal(rows[0].ja, "プレミアムリップケア");

  const enApplied = applySheet(docData, docData, "categories", "en");
  assert.equal(enApplied.items[0].name, "Luxury Lip Care");
  assert.equal(enApplied.items[1].name, "Quà tặng");

  const jaApplied = applySheet(docData, docData, "categories", "ja");
  assert.equal(jaApplied.items[0].name, "プレミアムリップケア");
});
