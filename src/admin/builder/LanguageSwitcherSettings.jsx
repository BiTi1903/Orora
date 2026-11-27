import { SettingGroup, StyleTypographyBlock, ColorField } from "./ui";

export default function LanguageSwitcherSettings({ navbar, onChange }) {
  const langSettings = navbar.navStyles?.languageSwitcher || {};

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

  const openTranslationsTab = () => {
    window.dispatchEvent(new CustomEvent("orora-admin-navigate", { detail: { tab: "translations" } }));
  };

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
            <span>Bật Tiếng Nhật (JP)</span>
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

      <SettingGroup title="Quản lý bản dịch nội dung">
        <small className="builder-help">
          Toàn bộ bản dịch Tiếng Anh (EN) và Tiếng Nhật (JP) cho Trang chủ, Danh mục, Sản phẩm và Cụm từ được quản lý tập trung tại mục <strong>Bản dịch</strong> (hỗ trợ xuất/nhập Excel) để tránh trùng lặp.
        </small>
        <button
          type="button"
          className="admin-btn primary"
          style={{ width: "100%", marginTop: 8 }}
          onClick={openTranslationsTab}
        >
          Mở trang Bản dịch →
        </button>
      </SettingGroup>
    </>
  );
}
