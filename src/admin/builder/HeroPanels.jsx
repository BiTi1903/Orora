import { SettingGroup, StyleTypographyBlock } from "./ui";

function HeroFieldSettings({ data, hero, onChange }) {
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
        <small className="builder-help">Ảnh hero này cũng được dùng làm ảnh đại diện khi chia sẻ link trang chủ. Ứng dụng nhắn tin có thể cần cập nhật lại ảnh đã lưu đệm.</small>
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
                <div className="builder-field" style={{ marginTop: 18 }}>
          <label>URL ảnh nền cho điện thoại</label>
          <input
            value={hero.heroImageMobile || ""}
            onChange={(e) =>
              onChange({ heroImageMobile: e.target.value })
            }
            placeholder="Để trống = dùng ảnh desktop"
          />
          <small className="builder-help">
            Chỉ dùng khi màn hình ≤ 600px. Nên dùng ảnh dọc (khoảng 4:5 hoặc 9:16).
            Muốn xem thử: chọn Mobile ở phía trên phần xem trước.
          </small>
        </div>

        {hero.heroImageMobile && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #ead9e0",
              height: 160,
              width: 100,
              backgroundImage: `url("${hero.heroImageMobile}")`,
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
        <div className="builder-field"><label htmlFor="hero-rotator-prefix">Chữ trước từ chuyển động</label><input id="hero-rotator-prefix" maxLength={100} value={hero.heroRotatorPrefix ?? "Làn da"} placeholder="Làn da" onChange={(event) => onChange({ heroRotatorPrefix: event.target.value })} /></div>
        <div className="builder-field"><label htmlFor="hero-rotator-suffix">Chữ sau từ chuyển động</label><input id="hero-rotator-suffix" maxLength={100} value={hero.heroRotatorSuffix ?? "mỗi ngày"} placeholder="mỗi ngày" onChange={(event) => onChange({ heroRotatorSuffix: event.target.value })} /></div>
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

export function HeroSettings(props) {
  const {hero,onChange,data}=props;
  const style=(key,patch)=>onChange({heroStyles:{...hero.heroStyles,[key]:{...hero.heroStyles?.[key],...patch}}});
  return <><HeroFieldSettings {...props} />{data?.type === "heroRotator" && <>
   <StyleTypographyBlock title="Chữ trước / sau" style={hero.heroStyles?.rotator || {}} onStyleChange={patch=>style('rotator',patch)}/>
   <StyleTypographyBlock title="Từ thay đổi — kiểu chữ và độ đậm" style={hero.heroStyles?.rotatorAccent || {}} onStyleChange={patch=>style('rotatorAccent',patch)}/>
  </>}</>;
}
