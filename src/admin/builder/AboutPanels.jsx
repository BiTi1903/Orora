import ImageUploadControl from "./ImageUploadControl";
import {
  SettingGroup,
  SpacingControls,
  SelectField,
  StyleTypographyBlock,
  TypographyControls,
  ColorField,
} from "./ui";
import { SPACE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE } from "./registry";

export function SectionSettings({ data, onChange }) {
  return (
    <>
      <SettingGroup title="Nền">
        <ColorField
          label="Màu nền"
          value={data.background}
          onChange={(value) =>
            onChange({ background: value })
          }
        />
      </SettingGroup>

      <SettingGroup title="Khoảng cách">
        <SpacingControls style={data} onChange={onChange}/>

        <SelectField
          label="Khoảng cách cột"
          value={data.gap}
          options={[2, 4, 5, 6, 7, 8, 10, 12]}
          suffix="%"
          onChange={(value) =>
            onChange({ gap: Number(value) })
          }
        />
      </SettingGroup>
    </>
  );
}

export function ImageSettings({ data, onChange }) {
  return (
    <>
      <SettingGroup title="Ảnh">
        <ImageUploadControl label="Ảnh chính" value={data.src || ""} width={2000} onChange={src => onChange({ src })}/>
        <div className="builder-field">
          <label>Ảnh chính</label>
          <input
            value={data.src || ""}
            onChange={(e) =>
              onChange({ src: e.target.value })
            }
            placeholder="/about.jpg"
          />
        </div>
        {[0, 1, 2].map((index) => (
          <div className="builder-field" key={index}>
            <label>Ảnh phụ {index + 1}</label>
            <ImageUploadControl label={`Ảnh phụ ${index + 1}`} value={(data.extras || [])[index] || ""} onChange={url => { const extras = [...(data.extras || ["", "", ""])]; extras[index] = url; onChange({ extras }); }}/>
            <input
              value={(data.extras || [])[index] || ""}
              onChange={(e) => {
                const extras = [...(data.extras || ["", "", ""])];
                extras[index] = e.target.value;
                onChange({ extras });
              }}
              placeholder="/about.jpg"
            />
          </div>
        ))}
      </SettingGroup>

      <SettingGroup title="Kích thước">
        <SelectField
          label="Chiều rộng"
          value={data.width}
          options={[40, 45, 48, 50, 52, 55, 60]}
          suffix="%"
          onChange={(value) =>
            onChange({ width: Number(value) })
          }
        />

        <SelectField
          label="Chiều cao"
          value={data.height}
          options={[400, 450, 500, 550, 600, 620, 650, 700, 750, 800]}
          suffix="px"
          onChange={(value) =>
            onChange({ height: Number(value) })
          }
        />

        <SelectField
          label="Bo góc"
          value={data.radius}
          options={[0, 20, 28, 40, 60, 100, 140, 180, 200]}
          suffix="px"
          onChange={(value) =>
            onChange({ radius: Number(value) })
          }
        />

        <SelectField
          label="Viền"
          value={data.borderWidth}
          options={[0, 2, 4, 6, 8, 10]}
          suffix="px"
          onChange={(value) =>
            onChange({ borderWidth: Number(value) })
          }
        />
      </SettingGroup>
    </>
  );
}

export function StatTextSettings({ data, onChange, onStyleChange }) {
  const safe = data || { text: "", suffix: "", style: {}, kind: "statValue", index: 0 };
  const style = safe.style || {};
  const isValue = safe.kind === "statValue";

  const space = (label, key) => (
    <SelectField
      label={label}
      value={style[key] ?? 0}
      options={SPACE_OPTIONS}
      suffix="px"
      onChange={(value) => onStyleChange({ [key]: Number(value) })}
    />
  );

  return (
    <>
      <SettingGroup title={isValue ? "Nội dung chữ lớn" : "Nội dung chữ nhỏ"}>
        <small className="builder-help">
          {isValue
            ? "Font, size, margin và padding áp dụng cho mọi chữ lớn."
            : "Font, size, margin và padding áp dụng cho mọi chữ nhỏ."}
        </small>
        <div className="builder-field">
          <label>{isValue ? "Chữ / số của ô này" : "Mô tả của ô này"}</label>
          <input
            value={safe.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
        {isValue && (
          <div className="builder-field">
            <label>Ký hiệu phía sau (+, %)</label>
            <input
              value={safe.suffix || ""}
              onChange={(e) => onChange({ text: safe.text ?? "", suffix: e.target.value })}
            />
          </div>
        )}
      </SettingGroup>

      <SettingGroup title="Typography">
        <TypographyControls style={style} onChange={onStyleChange} />
      </SettingGroup>

      <SettingGroup title="Padding / margin">
        <div className="builder-field-row">
          {space("Margin trên", "marginTop")}
          {space("Margin phải", "marginRight")}
        </div>
        <div className="builder-field-row">
          {space("Margin dưới", "marginBottom")}
          {space("Margin trái", "marginLeft")}
        </div>
        <div className="builder-field-row">
          {space("Padding trên", "paddingTop")}
          {space("Padding phải", "paddingRight")}
        </div>
        <div className="builder-field-row">
          {space("Padding dưới", "paddingBottom")}
          {space("Padding trái", "paddingLeft")}
        </div>
      </SettingGroup>
    </>
  );
}

export function StatsSettings({ stats, about, onChange }) {
  const list = Array.isArray(stats)
    ? stats.map((item) => ({
        source: item?.source || "",
        value: item?.value ?? 0,
        suffix: item?.suffix || "",
        label: item?.label || "",
      }))
    : DEFAULT_ABOUT.stats;

  const valueStyle = about?.statValue || DEFAULT_ABOUT.statValue;
  const labelStyle = about?.statLabel || DEFAULT_ABOUT.statLabel;

  const patchList = (next) => onChange({ _statsList: next });

  return (
    <>
      <StyleTypographyBlock
        title="Kiểu số"
        style={valueStyle}
        onStyleChange={(patch) => onChange({ _statValue: patch })}
      />

      <SettingGroup title="Kiểu mô tả">
        <TypographyControls
          style={{
            ...labelStyle,
              fontFamily: toBareFontFamily(labelStyle.fontFamily),
            fontSize: labelStyle.fontSize ?? "",
            fontWeight: labelStyle.fontWeight ?? "",
            color: labelStyle.color || "",
            letterSpacing: labelStyle.letterSpacing ?? "",
            lineHeight: labelStyle.lineHeight ?? "",
            textTransform: labelStyle.textTransform ?? "",
            italic:
              labelStyle.italic || labelStyle.fontStyle === "italic",
            textAlign: labelStyle.textAlign || "left",
            marginTop: labelStyle.marginTop ?? 0,
            marginBottom: labelStyle.marginBottom ?? 0,
            paddingTop: labelStyle.paddingTop ?? 0,
            paddingBottom: labelStyle.paddingBottom ?? 0,
            maxWidth: labelStyle.maxWidth ?? 100,
          }}
          onChange={(patch) => {
            const next = { ...patch };
            if ("fontFamily" in patch) {
              next.fontFamily = toFullFontFamily(patch.fontFamily);
            }
            if ("italic" in patch) {
              next.fontStyle = patch.italic ? "italic" : "normal";
            }
            onChange({ _statLabel: next });
          }}
        />
      </SettingGroup>

      <SettingGroup title="Nội dung">
        {list.map((item, index) => (
          <div className="builder-stat-edit" key={index}>
            <div className="builder-stat-number">#{index + 1}</div>
            <label>Nguồn kiểm chứng (HTTPS)<input type="url" value={item.source||""} onChange={event=>patchList(list.map((entry,i)=>i===index?{...entry,source:event.target.value}:entry))}/></label>
            <p>Website chỉ hiển thị số liệu có liên kết nguồn.</p>

            <div className="builder-field-row">
              <div className="builder-field">
                <label>Chữ / số hiển thị</label>
                <input
                  type="text"
                  value={item.value ?? ""}
                  onChange={(e) => {
                    const next = [...list];
                    next[index] = {
                      ...next[index],
                      value: e.target.value,
                    };
                    patchList(next);
                  }}
                />
              </div>

              <div className="builder-field">
                <label>Ký hiệu</label>
                <input
                  value={item.suffix || ""}
                  onChange={(e) => {
                    const next = [...list];
                    next[index] = {
                      ...next[index],
                      suffix: e.target.value,
                    };
                    patchList(next);
                  }}
                />
              </div>
            </div>

            <div className="builder-field">
              <label>Mô tả</label>
              <input
                value={item.label || ""}
                onChange={(e) => {
                  const next = [...list];
                  next[index] = {
                    ...next[index],
                    label: e.target.value,
                  };
                  patchList(next);
                }}
              />
            </div>
          </div>
        ))}
      </SettingGroup>
    </>
  );
}

export function TextSettings({
  selected,
  data,
  onChange,
  onStyleChange,
}) {
  const safe = data || { text: "", style: { ...DEFAULT_STYLE } };
  const style = safe.style || { ...DEFAULT_STYLE };

  return (
    <>
      <SettingGroup title="Nội dung">
        <div className="builder-field">
          <label>
            {selected === "text"
              ? "Nội dung"
              : "Văn bản"}
          </label>

          <textarea
            rows={selected === "text" ? 7 : 4}
            value={safe.text || ""}
            onChange={(e) =>
              onChange({
                text: e.target.value,
              })
            }
            placeholder="Nhập nội dung..."
          />

          <small className="builder-help">
            Nhấn Enter để xuống dòng.
          </small>
        </div>
      </SettingGroup>

      <SettingGroup title="Typography">
        <TypographyControls
          style={style}
          onChange={onStyleChange}
        />
      </SettingGroup>
    </>
  );
}
