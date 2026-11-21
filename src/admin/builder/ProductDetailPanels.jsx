import PurchaseOptionsSettings from "./PurchaseOptionsSettings";
import { ColorField } from "./ui";
import ProductContactSettings from "./ProductContactSettings";
import ProductRelatedSettings from "./ProductRelatedPanels";
import ProductImageSettings from "./ProductImagePanels";
import { SloganAppearanceEditor, SloganTypographyEditor } from "../ProductSloganDesign";
import { SettingGroup, SelectField, StyleTypographyBlock } from "./ui";
import { SPACE_OPTIONS } from "./options";
import { PRODUCT_DETAIL_COLOR_DEFAULTS } from "../controls/color-defaults";

export function ProductDetailSettings({ selected, data, productDetail, onChange, onStyleChange }) {
  if (!data || data.type === "pdEmpty") {
    return <div className="builder-empty">Chọn một thành phần trên preview.</div>;
  }
  if (selected === "pdPurchaseOptions") {
    return (
      <PurchaseOptionsSettings
        initialGroup="checkout"
        value={productDetail.purchaseOptions || {}}
        onChange={onStyleChange}
      />
    );
  }
  if (selected === "pdAddToCart") {
    const value = productDetail.purchaseOptions || {};
    return (
      <>
        <SettingGroup title="Nút Thêm vào giỏ">
          <label className="builder-field">
            Chữ nút Thêm vào giỏ
            <input
              maxLength={80}
              value={value.addToCartLabel || ""}
              placeholder="Thêm vào giỏ"
              onChange={(e) => onStyleChange({ addToCartLabel: e.target.value })}
            />
          </label>
          <ColorField
            label="Màu nền nút"
            value={value.addToCartBackground}
            fallback="#fff0f5"
            onChange={(color) => onStyleChange({ addToCartBackground: color })}
          />
          <ColorField
            label="Màu viền nút"
            value={value.addToCartBorderColor}
            fallback="#efd7e1"
            onChange={(color) => onStyleChange({ addToCartBorderColor: color })}
          />
        </SettingGroup>
        <StyleTypographyBlock
          title="Kiểu chữ nút Thêm vào giỏ"
          style={value.addToCartStyle || {}}
          onStyleChange={(patch) => onStyleChange({ addToCartStyle: { ...value.addToCartStyle, ...patch } })}
        />
      </>
    );
  }
  if (["pdWebsiteText", "pdFacebookText", "pdTiktokText"].includes(selected)) {
    const value = productDetail.purchaseOptions || {},
      channel =
        selected === "pdWebsiteText" ? "website" : selected === "pdFacebookText" ? "facebook" : "tiktok",
      label = channel === "website" ? "Mua ngay" : channel === "facebook" ? "Facebook" : "TikTok";
    return (
      <>
        <SettingGroup title={`Nội dung nút ${label}`}>
          <label className="builder-field">
            {`Chữ nút ${label}`}
            <input
              value={(channel === "website" ? value.mobileBuyLabel || value.websiteLabel : value[`${channel}Label`]) || ""}
              placeholder={channel === "website" ? "Mua ngay" : label}
              onChange={(e) =>
                onStyleChange({
                  [`${channel}Label`]: e.target.value,
                  ...(channel === "website"
                    ? { mobileBuyLabel: e.target.value }
                    : { [channel === "facebook" ? "customFacebookLabel" : "customTiktokLabel"]: true }),
                })
              }
            />
          </label>
          <ColorField
            label={`Nền nút ${label}`}
            value={value[`${channel}Background`]}
            fallback={PRODUCT_DETAIL_COLOR_DEFAULTS.buttonBackground}
            onChange={(color) => onStyleChange({ [`${channel}Background`]: color })}
          />
          {channel === "website" && (
            <>
              <label className="builder-field">
                Độ đục kính lỏng (%)
                <input
                  type="number"
                  min={45}
                  max={95}
                  value={value.quickBuyOpacity ?? 74}
                  onChange={(e) => onStyleChange({ quickBuyOpacity: Number(e.target.value) })}
                />
              </label>
              <label className="builder-field">
                Độ mờ nền kính (px)
                <input
                  type="number"
                  min={6}
                  max={32}
                  value={value.quickBuyBlur ?? 20}
                  onChange={(e) => onStyleChange({ quickBuyBlur: Number(e.target.value) })}
                />
              </label>
            </>
          )}
        </SettingGroup>
        <StyleTypographyBlock
          title={`Kiểu chữ nút ${label}`}
          style={channel === "website" ? value : value[`${channel}Style`] || {}}
          onStyleChange={(patch) =>
            onStyleChange(
              channel === "website"
                ? patch
                : { [`${channel}Style`]: { ...value[`${channel}Style`], ...patch } },
            )
          }
        />
      </>
    );
  }
  const tabKey = {
    pdTabDescription: "description",
    pdTabSpecifications: "specifications",
    pdTabUsage: "usage",
  }[selected];
  if (tabKey) {
    const tabs = productDetail.informationTabs || {};
    return (
      <>
        <SettingGroup title="Tên tab thông tin">
          <label className="builder-field">
            Tên tab
            <input
              value={tabs.labels?.[tabKey] || ""}
              onChange={(e) =>
                onChange({
                  informationTabs: { ...tabs, labels: { ...tabs.labels, [tabKey]: e.target.value } },
                })
              }
            />
          </label>
        </SettingGroup>
        <p className="builder-help">Màu và kiểu chữ dùng chung cho ba tab để giữ giao diện đồng nhất.</p>
        <StyleTypographyBlock style={productDetail.navigation || {}} onStyleChange={onStyleChange} />
      </>
    );
  }

  if (selected === "pdContactActions")
    return <ProductContactSettings value={productDetail.contactActions || {}} onChange={onStyleChange} />;
  if (selected === "pdSloganCard")
    return <SloganAppearanceEditor value={productDetail.sloganCard} onChange={onStyleChange} />;
  if (["pdSloganTitle", "pdSloganBody"].includes(selected))
    return (
      <SloganTypographyEditor
        title={selected === "pdSloganTitle" ? "Slogan — Chữ tiêu đề" : "Slogan — Chữ nội dung"}
        body={selected === "pdSloganBody"}
        value={productDetail[selected === "pdSloganTitle" ? "sloganTitle" : "sloganBody"]}
        onChange={onStyleChange}
      />
    );

  if (["relTitle", "relImage"].includes(selected) || data.type === "pdRelImage")
    return (
      <ProductRelatedSettings
        selected={selected}
        data={data}
        productDetail={productDetail}
        onChange={onChange}
        onStyleChange={onStyleChange}
      />
    );
  if (["pdImage", "pdThumbs"].includes(selected) || ["pdImage", "pdThumbs"].includes(data.type))
    return (
      <ProductImageSettings selected={selected} data={data} productDetail={productDetail} onStyleChange={onStyleChange} />
    );

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
          <small className="builder-help">Đây là chữ hiển thị của 4 mục. Font bên dưới dùng chung.</small>
        </SettingGroup>
        <StyleTypographyBlock style={labelStyle} onStyleChange={onStyleChange} />
      </>
    );
  }

  const meta = data.meta;
  const style = productDetail[meta.styleKey] || {};

  return (
    <>
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

      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />

      {(meta.textKey || String(selected || "").startsWith("rel")) && (
        <SettingGroup title="Padding / margin">
          <div className="builder-field-row">
            {/* <SelectField label="Margin trên" value={style.marginTop ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginTop: Number(value) })} /> */}
            <SelectField
              label="Margin phải"
              value={style.marginRight ?? 0}
              options={SPACE_OPTIONS}
              suffix="px"
              onChange={(value) => onStyleChange({ marginRight: Number(value) })}
            />
          </div>
          <div className="builder-field-row">
            {/* <SelectField label="Margin dưới" value={style.marginBottom ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginBottom: Number(value) })} /> */}
            <SelectField
              label="Margin trái"
              value={style.marginLeft ?? 0}
              options={SPACE_OPTIONS}
              suffix="px"
              onChange={(value) => onStyleChange({ marginLeft: Number(value) })}
            />
          </div>
          <div className="builder-field-row">
            {/* <SelectField label="Padding trên" value={style.paddingTop ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingTop: Number(value) })} /> */}
            <SelectField
              label="Padding phải"
              value={style.paddingRight ?? 0}
              options={SPACE_OPTIONS}
              suffix="px"
              onChange={(value) => onStyleChange({ paddingRight: Number(value) })}
            />
          </div>
          <div className="builder-field-row">
            {/* <SelectField label="Padding dưới" value={style.paddingBottom ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingBottom: Number(value) })} /> */}
            <SelectField
              label="Padding trái"
              value={style.paddingLeft ?? 0}
              options={SPACE_OPTIONS}
              suffix="px"
              onChange={(value) => onStyleChange({ paddingLeft: Number(value) })}
            />
          </div>
        </SettingGroup>
      )}

      <SettingGroup title="Gợi ý">
        <p className="builder-help" data-spacing="flush">
          {String(selected || "").startsWith("rel") ? (
            <>
              Kiểu chữ này chỉ áp dụng cho mục <strong>Sản phẩm khác</strong> ở trang chi tiết (không đổi
              Collection ở trang chủ).
            </>
          ) : (
            <>
              Kiểu chữ này áp dụng cho trang chi tiết của <strong>mọi sản phẩm</strong>. Nội dung từng SP sửa
              ở mục Sản phẩm.
            </>
          )}
        </p>
      </SettingGroup>
    </>
  );
}
