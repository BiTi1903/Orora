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
