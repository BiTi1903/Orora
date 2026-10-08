import { SettingGroup, SelectField, StyleTypographyBlock, TypographyControls } from "./ui";
import { SPACE_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE, HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function getHeroSelectedData(hero, selected) {
  const meta = HERO_FIELD_MAP[selected];
  if (!meta) {
    return { type: "heroEmpty", data: null };
  }
  return { type: meta.type, data: hero, meta };
}


export function HeroSettings({ selected, data, hero, onChange }) {
  if (!data || data.type === "heroEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  if (data.type === "heroImage") {
    return (
      <SettingGroup title="Ảnh nền">
        <div className="builder-field">
          <label>URL ảnh nền</label>
          <input
            value={hero.heroImage || ""}
            onChange={(e) =>
              onChange({ heroImage: e.target.value })
            }
            placeholder="/hero.jpg"
          />
          <small className="builder-help">
            Dán URL ảnh (Cloudinary hoặc đường dẫn local).
          </small>
        </div>

        {hero.heroImage && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #ead9e0",
              height: 120,
              backgroundImage: `url("${hero.heroImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
      </SettingGroup>
    );
  }

  if (data.type === "heroRotator") {
    const text = (hero.heroRotator || []).join("\n");
    return (
      <SettingGroup title="Các từ đổi liên tục">
        <div className="builder-field">
          <label>Mỗi dòng một từ</label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) =>
              onChange({
                heroRotator: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={"dịu nhẹ\nrạng rỡ\ntự tin"}
          />
          <small className="builder-help">
            Preview hiển thị từ đầu tiên. Trên trang thật sẽ xoay lần lượt.
          </small>
        </div>
      </SettingGroup>
    );
  }

  if (data.type === "heroButton") {
    const { textKey, linkKey, label } = data.meta;
    return (
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Chữ nút</label>
          <input
            value={hero[textKey] || ""}
            onChange={(e) =>
              onChange({ [textKey]: e.target.value })
            }
          />
        </div>
        <div className="builder-field">
          <label>Liên kết</label>
          <input
            value={hero[linkKey] || ""}
            onChange={(e) =>
              onChange({ [linkKey]: e.target.value })
            }
            placeholder="#about"
          />
        </div>
      </SettingGroup>
    );
  }

  if (data.type === "heroText") {
    const { key, label, rows } = data.meta;
    return (
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Nội dung</label>
          {rows ? (
            <textarea
              rows={rows}
              value={hero[key] || ""}
              onChange={(e) =>
                onChange({ [key]: e.target.value })
              }
            />
          ) : (
            <input
              value={hero[key] || ""}
              onChange={(e) =>
                onChange({ [key]: e.target.value })
              }
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  return null;
}
