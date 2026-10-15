import { SettingGroup, SelectField, StyleTypographyBlock, TypographyControls } from "./ui";
import { SPACE_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE, HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function getProductDetailSelectedData(productDetail, selected, detailProduct) {
  if (typeof selected === "string" && selected.startsWith("pdValue:")) {
    const key = selected.split(":")[1];
    return {
      type: "pdValue",
      data: productDetail,
      meta: {
        key,
        label: `Nội dung ${key}`,
        text: detailProduct?.[key] || "",
      },
    };
  }
  if (typeof selected === "string" && selected.startsWith("pdLabel:")) {
    const key = selected.split(":")[1];
    const styleKey = `${key}Label`;
    return {
      type: "pdFieldLabel",
      data: productDetail,
      meta: {
        key,
        styleKey,
        label: `Tên mục ${key}`,
        sample: key[0].toUpperCase() + key.slice(1),
      },
    };
  }
  const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
  if (!meta) {
    return { type: "pdEmpty", data: null };
  }
  if (meta.type === "pdImage" || selected === "pdImage") {
    return { type: "pdImage", data: productDetail, meta };
  }
  if (meta.type === "pdThumbs" || selected === "pdThumbs") {
    return { type: "pdThumbs", data: productDetail, meta };
  }
  return { type: "pdStyle", data: productDetail, meta };
}


export function ProductDetailSettings({
  selected,
  data,
  productDetail,
  detailProduct,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "pdEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  if (data.type === "pdImage" || selected === "pdImage") {
    const layout = productDetail.imageLayout || {};
    const space = (label, key) => (
      <SelectField
        label={label}
        value={layout[key] ?? 0}
        options={SPACE_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <SettingGroup title="Khối ảnh (chính + phụ)">
          <small className="builder-help">
            Ngang / margin áp dụng cả khối (ảnh chính + ảnh phụ đi cùng).
            Chiều dọc / padding / viền chỉ khung ảnh chính. Click hàng ảnh phụ để chỉnh riêng.
          </small>
        </SettingGroup>

        <SettingGroup title="Kích thước">
          <SelectField
            label="Chiều ngang cả khối"
            value={layout.widthPercent ?? 100}
            options={[40, 50, 60, 70, 75, 80, 85, 90, 95, 100]}
            suffix="%"
            onChange={(value) =>
              onStyleChange({ widthPercent: Number(value) })
            }
          />
          <SelectField
            label="Chiều ngang tối đa"
            value={layout.maxWidth ?? 420}
            options={[280, 320, 360, 400, 420, 460, 500, 560, 620, 700, 0]}
            suffix="px"
            onChange={(value) =>
              onStyleChange({ maxWidth: Number(value) })
            }
          />
          <small className="builder-help" style={{ display: "block", marginTop: -6 }}>
            Tối đa = 0 → không giới hạn px (chỉ theo %).
          </small>
          <SelectField
            label="Chiều dọc khung ảnh chính"
            value={layout.height ?? 0}
            options={[0, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 720]}
            suffix="px"
            onChange={(value) => onStyleChange({ height: Number(value) })}
          />
          <small className="builder-help" style={{ display: "block", marginTop: -6 }}>
            Chiều dọc = 0 → dùng tỷ lệ khung. Ảnh phụ nằm dưới, đi theo khối.
          </small>
          <SelectField
            label="Tỷ lệ khung ảnh chính"
            value={layout.aspectRatio ?? "3 / 4"}
            options={["1 / 1", "3 / 4", "4 / 5", "2 / 3", "3 / 5", "16 / 9"]}
            onChange={(value) => onStyleChange({ aspectRatio: value })}
          />
          <SelectField
            label="Cách cắt ảnh"
            value={layout.objectFit ?? "cover"}
            options={["cover", "contain", "fill"]}
            onChange={(value) => onStyleChange({ objectFit: value })}
          />
          <SelectField
            label="Khoảng cách ảnh chính / ảnh phụ"
            value={layout.gap ?? 14}
            options={[0, 6, 8, 10, 12, 14, 16, 20, 24, 32]}
            suffix="px"
            onChange={(value) => onStyleChange({ gap: Number(value) })}
          />
        </SettingGroup>

        <SettingGroup title="Bo góc & viền">
          <SelectField
            label="Bo góc"
            value={layout.radius ?? 28}
            options={[0, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60]}
            suffix="px"
            onChange={(value) => onStyleChange({ radius: Number(value) })}
          />
          <SelectField
            label="Độ dày viền"
            value={layout.borderWidth ?? 6}
            options={[0, 2, 4, 5, 6, 8, 10, 12, 16]}
            suffix="px"
            onChange={(value) =>
              onStyleChange({ borderWidth: Number(value) })
            }
          />
          <div className="builder-field">
            <label>Màu viền</label>
            <input
              type="color"
              value={layout.borderColor || "#ffffff"}
              onChange={(e) =>
                onStyleChange({ borderColor: e.target.value })
              }
              style={{ width: 48, height: 32, padding: 0, border: "none", cursor: "pointer" }}
            />
          </div>
        </SettingGroup>

        <SettingGroup title="Padding khung ảnh">
          <div className="builder-field-row">
            {space("Trên", "paddingTop")}
            {space("Phải", "paddingRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "paddingBottom")}
            {space("Trái", "paddingLeft")}
          </div>
        </SettingGroup>

        <SettingGroup title="Margin cả khối (chính + phụ)">
          <div className="builder-field-row">
            {space("Trên", "marginTop")}
            {space("Phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "marginBottom")}
            {space("Trái", "marginLeft")}
          </div>
        </SettingGroup>
      </>
    );
  }

  if (data.type === "pdThumbs" || selected === "pdThumbs") {
    const layout = productDetail.thumbsLayout || {};
    const space = (label, key) => (
      <SelectField
        label={label}
        value={layout[key] ?? 0}
        options={SPACE_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <SettingGroup title="Ảnh phụ">
          <small className="builder-help">
            Khung riêng cho hàng ảnh phụ (thumbnail). Bấm từng ảnh vẫn đổi ảnh chính.
          </small>
        </SettingGroup>

        <SettingGroup title="Kích thước & khoảng cách">
          <SelectField
            label="Chiều cao mỗi ảnh"
            value={layout.height ?? 0}
            options={[0, 64, 72, 80, 96, 110, 120, 140, 160]}
            suffix="px"
            onChange={(value) => onStyleChange({ height: Number(value) })}
          />
          <small className="builder-help" style={{ display: "block", marginTop: -6 }}>
            0 = tỷ lệ vuông theo chiều ngang.
          </small>
          <SelectField
            label="Khoảng cách giữa 2 ảnh"
            value={layout.gap ?? 10}
            options={[0, 4, 6, 8, 10, 12, 14, 16, 20, 24]}
            suffix="px"
            onChange={(value) => onStyleChange({ gap: Number(value) })}
          />
        </SettingGroup>

        <SettingGroup title="Bo góc & viền">
          <SelectField
            label="Bo góc"
            value={layout.radius ?? 14}
            options={[0, 6, 8, 10, 12, 14, 16, 20, 24, 28]}
            suffix="px"
            onChange={(value) => onStyleChange({ radius: Number(value) })}
          />
          <SelectField
            label="Độ dày viền"
            value={layout.borderWidth ?? 2}
            options={[0, 1, 2, 3, 4, 5, 6, 8]}
            suffix="px"
            onChange={(value) =>
              onStyleChange({ borderWidth: Number(value) })
            }
          />
          <div className="builder-field">
            <label>Màu viền</label>
            <input
              type="color"
              value={
                layout.borderColor && layout.borderColor !== "transparent"
                  ? layout.borderColor
                  : "#ffffff"
              }
              onChange={(e) =>
                onStyleChange({ borderColor: e.target.value })
              }
              style={{
                width: 48,
                height: 32,
                padding: 0,
                border: "none",
                cursor: "pointer",
              }}
            />
          </div>
          <div className="builder-field">
            <label>Màu viền khi chọn</label>
            <input
              type="color"
              value={layout.activeBorderColor || "#b8446d"}
              onChange={(e) =>
                onStyleChange({ activeBorderColor: e.target.value })
              }
              style={{
                width: 48,
                height: 32,
                padding: 0,
                border: "none",
                cursor: "pointer",
              }}
            />
          </div>
        </SettingGroup>

        <SettingGroup title="Padding hàng ảnh phụ">
          <div className="builder-field-row">
            {space("Trên", "paddingTop")}
            {space("Phải", "paddingRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "paddingBottom")}
            {space("Trái", "paddingLeft")}
          </div>
        </SettingGroup>

        <SettingGroup title="Margin hàng ảnh phụ">
          <div className="builder-field-row">
            {space("Trên", "marginTop")}
            {space("Phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "marginBottom")}
            {space("Trái", "marginLeft")}
          </div>
        </SettingGroup>
      </>
    );
  }

  if (selected === "pdRowValue" || data.type === "pdValue") {
    const style = productDetail.rowValue || {};
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
        <small className="builder-help">
          Chữ sửa ở từng sản phẩm. Font, size, căn lề, margin và padding dùng chung cho nội dung.
        </small>
        <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
        <SettingGroup title="Padding / margin">
          <div className="builder-field-row">
            {/* {space("Margin trên", "marginTop")} */}
            {space("Margin phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {/* {space("Margin dưới", "marginBottom")} */}
            {space("Margin trái", "marginLeft")}
          </div>
          <div className="builder-field-row">
            {/* {space("Padding trên", "paddingTop")} */}
            {space("Padding phải", "paddingRight")}
          </div>
          <div className="builder-field-row">
            {/* {space("Padding dưới", "paddingBottom")} */}
            {space("Padding trái", "paddingLeft")}
          </div>
        </SettingGroup>
      </>
    );
  }

  if (data.type === "pdFieldLabel") {
    const meta = data.meta;
    const labelStyle = productDetail.rowLabel || {};
    const fields = [
      ["material", "Material"],
      ["size", "Size"],
      ["color", "Color"],
      ["origin", "Origin"],
    ];
    return (
      <>
        <SettingGroup title="Nội dung">
          {fields.map(([key, fallback]) => (
            <div className="builder-field" key={key}>
              <label>{fallback}</label>
              <input
                value={productDetail.detailLabels?.[key] ?? productDetail[`${key}Label`]?.text ?? fallback}
                onChange={(e) => onChange({ __labelKey: key, text: e.target.value })}
              />
            </div>
          ))}
          <small className="builder-help">
            Đây là chữ hiển thị của 4 mục. Font bên dưới dùng chung.
          </small>
        </SettingGroup>
        <StyleTypographyBlock style={labelStyle} onStyleChange={onStyleChange} />
      </>
    );
  }

  const meta = data.meta;
  const style = productDetail[meta.styleKey] || {};
  const showDetailNames = meta.styleKey === "rowLabel" || selected === "pdDetailsTitle";
  const valueStyleOnly = meta.styleKey === "rowValue";

  return (
    <>
      {/* {showDetailNames && (
        <SettingGroup title="Nội dung">
          {[
            ["material", "Material"],
            ["size", "Size"],
            ["color", "Color"],
            ["origin", "Origin"],
          ].map(([key, fallback]) => (
            <div className="builder-field" key={key}>
              <label>{fallback}</label>
              <input
                value={productDetail.detailLabels?.[key] ?? productDetail[`${key}Label`]?.text ?? fallback}
                onChange={(e) => onChange({ __labelKey: key, text: e.target.value })}
              />
            </div>
          ))}
        </SettingGroup>
      )} */}
      {meta.textKey && (
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>Tiêu đề</label>
            <input
              value={style.text ?? meta.sample ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
            />
          </div>
        </SettingGroup>
      )}

      {/* {(selected === "pdDetailsTitle" || String(selected || "").startsWith("pdLabel:")) && (
        <SettingGroup title="Tên 4 mục">
          {[
            ["material", "Material"],
            ["size", "Size"],
            ["color", "Color"],
            ["origin", "Origin"],
          ].map(([key, fallback]) => (
            <div className="builder-field" key={key}>
              <label>{fallback}</label>
              <input
                value={productDetail.detailLabels?.[key] ?? productDetail[`${key}Label`]?.text ?? fallback}
                onChange={(e) => {
                  const prev = selected;
                  onChange({
                    __labelKey: key,
                    text: e.target.value,
                    __restore: prev,
                  });
                }}
              />
            </div>
          ))}
        </SettingGroup>
      )} */}

      {valueStyleOnly ? (
        <SettingGroup title="Font / size dùng chung">
          <small className="builder-help">
            Áp dụng cho nội dung Material, Size, Color và Origin. Không sửa chữ ở đây.
          </small>
          <SelectField
            label="Font"
            value={toBareFontFamily(style.fontFamily)}
            options={FONT_OPTIONS}
            onChange={(value) => onStyleChange({ fontFamily: toFullFontFamily(value) })}
          />
          <SelectField
            label="Size"
            value={style.fontSize ?? 14}
            options={SIZE_OPTIONS}
            suffix="px"
            onChange={(value) => onStyleChange({ fontSize: Number(value) })}
          />
        </SettingGroup>
      ) : (
        <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
      )}

      {meta.textKey && (
        <SettingGroup title="Padding / margin">
          <div className="builder-field-row">
            {/* <SelectField label="Margin trên" value={style.marginTop ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginTop: Number(value) })} /> */}
            <SelectField label="Margin phải" value={style.marginRight ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginRight: Number(value) })} />
          </div>
          <div className="builder-field-row">
            {/* <SelectField label="Margin dưới" value={style.marginBottom ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginBottom: Number(value) })} /> */}
            <SelectField label="Margin trái" value={style.marginLeft ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginLeft: Number(value) })} />
          </div>
          <div className="builder-field-row">
            {/* <SelectField label="Padding trên" value={style.paddingTop ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingTop: Number(value) })} /> */}
            <SelectField label="Padding phải" value={style.paddingRight ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingRight: Number(value) })} />
          </div>
          <div className="builder-field-row">
            {/* <SelectField label="Padding dưới" value={style.paddingBottom ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingBottom: Number(value) })} /> */}
            <SelectField label="Padding trái" value={style.paddingLeft ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingLeft: Number(value) })} />
          </div>
        </SettingGroup>
      )}

      <SettingGroup title="Gợi ý">
        <p className="builder-help" style={{ margin: 0 }}>
          Kiểu chữ này áp dụng cho trang chi tiết của{" "}
          <strong>mọi sản phẩm</strong>. Nội dung từng SP sửa ở mục
          Sản phẩm.
        </p>
        {/* {meta.sample && (
          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 10,
              border: "1px dashed #ead9e0",
              background: "#fffafd",
              fontFamily: style.fontFamily || undefined,
              fontSize: style.fontSize
                ? `${style.fontSize}px`
                : undefined,
              fontWeight: style.fontWeight,
              fontStyle:
                style.italic || style.fontStyle === "italic"
                  ? "italic"
                  : "normal",
              letterSpacing:
                style.letterSpacing != null
                  ? typeof style.letterSpacing === "number"
                    ? `${style.letterSpacing}px`
                    : style.letterSpacing
                  : undefined,
              lineHeight: style.lineHeight,
              color: style.color,
            }}
          >
            {meta.sample}
          </div>
        )} */}
      </SettingGroup>
    </>
  );
}