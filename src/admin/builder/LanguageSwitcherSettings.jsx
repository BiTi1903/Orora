import { useState } from "react";
import { SettingGroup, StyleTypographyBlock, ColorField } from "./ui";
import { translatePhrase } from "../../lib/i18n";

const TRANSLATABLE_GROUPS = [
  {
    id: "hero",
    title: "Hero (Màn hình đầu trang)",
    fields: [
      ["heroEyebrow", "Dòng chữ nhỏ trên tiêu đề", "WELCOME TO"],
      ["heroTitle", "Tiêu đề chính", "ORORA"],
      ["heroDescription", "Mô tả ngắn", "Create something beautiful."],
      ["heroRotatorPrefix", "Chữ trước từ xoay vòng", "Làn da"],
      ["heroRotatorSuffix", "Chữ sau từ xoay vòng", "mỗi ngày"],
      ["heroButtonText", "Nút chính", "Khám phá"],
      ["shopButtonText", "Nút phụ", "Xem sản phẩm"],
      ["heroChip1", "Nhãn nổi 1", "Dịu nhẹ cho da"],
      ["heroChip2", "Nhãn nổi 2", "Thành phần thuần khiết"],
      ["heroChip3", "Nhãn nổi 3", "Cấp ẩm sâu"],
    ],
  },
  {
    id: "about",
    title: "Câu chuyện & Triết lý",
    fields: [
      ["storyLabel", "Nhãn Câu chuyện", "CÂU CHUYỆN"],
      ["storyTitle", "Tiêu đề Câu chuyện", "Vẻ đẹp từ sự"],
      ["storyHighlight", "Chữ in nghiêng nổi bật", "dịu dàng"],
      ["storyText", "Nội dung Câu chuyện", "", true],
      ["philosophyLabel", "Nhãn Triết lý", "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦"],
      ["philosophyBody", "Nội dung Triết lý", "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.", true],
    ],
  },
  {
    id: "collection",
    title: "Bộ sưu tập & Ưu điểm",
    fields: [
      ["collectionLabel", "Nhãn Bộ sưu tập", "BỘ SƯU TẬP"],
      ["collectionTitle", "Tiêu đề Bộ sưu tập", "Chăm sóc"],
      ["collectionHighlight", "Chữ nổi bật Bộ sưu tập", "mỗi ngày"],
      ["featuresLabel", "Nhãn Ưu điểm", "ORORA"],
      ["featuresTitle", "Tiêu đề Ưu điểm", "Nâng cấp bản thân"],
    ],
  },
  {
    id: "reviews_newsletter",
    title: "Cảm nhận & Nhận tin",
    fields: [
      ["testimonialsLabel", "Nhãn Cảm nhận", "CẢM NHẬN"],
      ["testimonialsTitle", "Tiêu đề Cảm nhận (đầu)", "Được"],
      ["testimonialsHighlight", "Chữ nổi bật Cảm nhận", "yêu thích"],
      ["testimonialsTitleEnd", "Tiêu đề Cảm nhận (cuối)", "bởi những cô nàng như bạn"],
      ["newsletterTitle", "Tiêu đề Nhận tin", "Nhận ưu đãi"],
      ["newsletterHighlight", "Chữ nổi bật Nhận tin", "ngay"],
      ["newsletterText", "Mô tả Nhận tin", "Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn.", true],
      ["newsletterPlaceholder", "Gợi ý ô nhập Email", "Email của bạn"],
      ["newsletterButton", "Nút Đăng ký", "Đăng ký"],
      ["newsletterConsent", "Dòng đồng ý nhận tin", "Tôi đồng ý nhận email về sản phẩm và ưu đãi từ ORORA. Có thể hủy đăng ký bất cứ lúc nào.", true],
    ],
  },
  {
    id: "footer",
    title: "Chân trang (Footer)",
    fields: [
      ["footerDescription", "Mô tả thương hiệu", "Chăm sóc làn da, nuôi dưỡng sự tự tin.", true],
      ["footerInfoTitle", "Tiêu đề cột Thông tin", "Thông tin"],
      ["footerAboutText", "Link Về ORORA", "Về ORORA"],
      ["footerShopText", "Link Sản phẩm", "Sản phẩm"],
      ["footerTrackingText", "Link Tra cứu đơn", "Tra cứu đơn hàng"],
      ["footerTermsText", "Link Điều khoản", "Điều khoản sử dụng"],
      ["footerPrivacyText", "Link Chính sách bảo mật", "Chính sách bảo mật"],
      ["footerContactTitle", "Tiêu đề cột Liên hệ", "Liên hệ"],
      ["footerSocialTitle", "Tiêu đề cột Mạng xã hội", "Kết nối với ORORA"],
      ["footerCopyright", "Dòng bản quyền", "© 2026 ORORA. Bảo lưu mọi quyền."],
    ],
  },
];

export default function LanguageSwitcherSettings({ navbar, onChange }) {
  const [editLang, setEditLang] = useState("en");
  const [activeGroup, setActiveGroup] = useState("hero");
  const langSettings = navbar.navStyles?.languageSwitcher || {};
  const translations = navbar.translations || {};
  const currentLangMap = translations[editLang] || {};

  const updateLangSettings = (patch) => {
    onChange({
      navStyles: {
        ...navbar.navStyles,
        languageSwitcher: {
          ...langSettings,
          ...patch,
        },
      },
    });
  };

  const updateTranslation = (key, value) => {
    const nextLangMap = { ...currentLangMap };
    if (value === "") delete nextLangMap[key];
    else nextLangMap[key] = value;
    onChange({
      translations: {
        ...translations,
        [editLang]: nextLangMap,
      },
    });
  };

  const updateNavLinkTranslation = (index, label) => {
    const baseLinks = Array.isArray(navbar.navLinks) ? navbar.navLinks : [];
    const currentLinks = Array.isArray(currentLangMap.navLinks)
      ? [...currentLangMap.navLinks]
      : baseLinks.map(() => ({}));
    while (currentLinks.length <= index) currentLinks.push({});
    currentLinks[index] = { ...(currentLinks[index] || {}), label };
    onChange({
      translations: {
        ...translations,
        [editLang]: {
          ...currentLangMap,
          navLinks: currentLinks,
        },
      },
    });
  };

  const fillSuggestedGroup = (group) => {
    const nextLangMap = { ...currentLangMap };
    for (const [key, , fallbackVi] of group.fields) {
      const suggestion = translatePhrase(fallbackVi, editLang);
      if (suggestion) nextLangMap[key] = suggestion;
    }
    onChange({
      translations: {
        ...translations,
        [editLang]: nextLangMap,
      },
    });
  };

  const groupObj = TRANSLATABLE_GROUPS.find((g) => g.id === activeGroup) || TRANSLATABLE_GROUPS[0];

  return (
    <>
      <SettingGroup title="Nút chuyển ngôn ngữ trên Navbar">
        <label className="builder-checkbox">
          <input
            type="checkbox"
            checked={langSettings.enabled !== false}
            onChange={(e) => updateLangSettings({ enabled: e.target.checked })}
          />
          <span>Hiển thị nút chọn ngôn ngữ (VI / EN / JP) trên Navbar</span>
        </label>
        <div className="builder-field-row">
          <label className="builder-checkbox">
            <input
              type="checkbox"
              checked={langSettings.enableEn !== false}
              onChange={(e) => updateLangSettings({ enableEn: e.target.checked })}
            />
            <span>Bật Tiếng Anh (EN)</span>
          </label>
          <label className="builder-checkbox">
            <input
              type="checkbox"
              checked={langSettings.enableJa !== false}
              onChange={(e) => updateLangSettings({ enableJa: e.target.checked })}
            />
            <span>Bật Tiếng Nhật (JA)</span>
          </label>
        </div>
        <div className="builder-field-row">
          <label>
            Nhãn VI
            <input
              value={langSettings.viLabel ?? ""}
              placeholder="VI"
              maxLength={12}
              onChange={(e) => updateLangSettings({ viLabel: e.target.value })}
            />
          </label>
          <label>
            Nhãn EN
            <input
              value={langSettings.enLabel ?? ""}
              placeholder="EN"
              maxLength={12}
              onChange={(e) => updateLangSettings({ enLabel: e.target.value })}
            />
          </label>
          <label>
            Nhãn JP
            <input
              value={langSettings.jaLabel ?? ""}
              placeholder="JP"
              maxLength={12}
              onChange={(e) => updateLangSettings({ jaLabel: e.target.value })}
            />
          </label>
        </div>
        <ColorField
          label="Màu nền khung chọn"
          value={langSettings.background}
          fallback="#ffffff"
          onChange={(background) => updateLangSettings({ background })}
        />
        <ColorField
          label="Màu viền khung chọn"
          value={langSettings.borderColor}
          fallback="#efd7e1"
          onChange={(borderColor) => updateLangSettings({ borderColor })}
        />
        <ColorField
          label="Màu nền nút đang chọn"
          value={langSettings.activeBackground}
          fallback="#b8446d"
          onChange={(activeBackground) => updateLangSettings({ activeBackground })}
        />
        <ColorField
          label="Màu chữ nút đang chọn"
          value={langSettings.activeColor}
          fallback="#ffffff"
          onChange={(activeColor) => updateLangSettings({ activeColor })}
        />
        <label>
          Bo góc khung (px)
          <input
            type="number"
            min={0}
            max={28}
            value={langSettings.radius ?? 20}
            onChange={(e) => updateLangSettings({ radius: Number(e.target.value) })}
          />
        </label>
      </SettingGroup>

      <StyleTypographyBlock
        title="Kiểu chữ nút ngôn ngữ"
        style={langSettings.text || {}}
        onStyleChange={(patch) =>
          updateLangSettings({ text: { ...(langSettings.text || {}), ...patch } })
        }
      />

      <SettingGroup title="Bản dịch nội dung (Tự động gợi ý + Tùy chỉnh)">
        <small className="builder-help">
          Để trống ô nào thì hệ thống sẽ tự dùng bản dịch gợi ý chuẩn cho ô đó. Nhập chữ vào để ghi đè theo ý bạn.
        </small>
        <div className="builder-field">
          <label>Ngôn ngữ đang chỉnh</label>
          <select
            value={editLang}
            onChange={(e) => {
              setEditLang(e.target.value);
              updateLangSettings({ previewLocale: e.target.value });
            }}
          >
            <option value="en">Tiếng Anh (English — EN)</option>
            <option value="ja">Tiếng Nhật (日本語 — JA)</option>
          </select>
        </div>

        <div className="builder-field">
          <label>Liên kết trên Navbar ({editLang.toUpperCase()})</label>
          {(navbar.navLinks || []).map((item, idx) => {
            const suggested = translatePhrase(item.label || "", editLang);
            const val = currentLangMap.navLinks?.[idx]?.label ?? "";
            return (
              <input
                key={idx}
                style={{ marginBottom: 6 }}
                value={val}
                placeholder={`${item.label} → ${suggested}`}
                onChange={(e) => updateNavLinkTranslation(idx, e.target.value)}
              />
            );
          })}
        </div>

        <div className="builder-field">
          <label>Khu vực nội dung Trang chủ</label>
          <select value={activeGroup} onChange={(e) => setActiveGroup(e.target.value)}>
            {TRANSLATABLE_GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="admin-btn"
          style={{ width: "100%", marginBottom: 8 }}
          onClick={() => fillSuggestedGroup(groupObj)}
        >
          Điền sẵn gợi ý {editLang.toUpperCase()} cho mục này để sửa nhanh
        </button>

        {groupObj.fields.map(([key, label, fallbackVi, multiline]) => {
          const suggested = translatePhrase(fallbackVi, editLang);
          const value = currentLangMap[key] ?? "";
          return (
            <div className="builder-field" key={`${editLang}:${key}`}>
              <label>{label}</label>
              {multiline ? (
                <textarea
                  rows={2}
                  value={value}
                  placeholder={suggested || "Tự động dịch theo từ điển"}
                  onChange={(e) => updateTranslation(key, e.target.value)}
                />
              ) : (
                <input
                  value={value}
                  placeholder={suggested || "Tự động dịch theo từ điển"}
                  onChange={(e) => updateTranslation(key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </SettingGroup>
    </>
  );
}
