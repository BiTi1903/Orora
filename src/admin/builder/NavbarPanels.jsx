import MobileNavSettings from "./MobileNavSettings";
import { SettingGroup, SelectField, StyleTypographyBlock } from "./ui";
import { SPACE_OPTIONS } from "./options";

export function NavbarSettings({ selected, navbar, onChange, onStyleChange }) {
  const isLogo = selected === "navLogo";
  const linkIndex = String(selected || "").startsWith("navLink:")
    ? Number(selected.split(":")[1])
    : 0;
  const link = (navbar.navLinks || [])[linkIndex] || { label: "", href: "/" };
  const style = isLogo ? navbar.navStyles?.logo : navbar.navStyles?.link;
  const space = (label, key) => (
    <SelectField
      label={label}
      value={style?.[key] ?? 0}
      options={SPACE_OPTIONS}
      suffix="px"
      onChange={(value) => onStyleChange({ [key]: Number(value) })}
    />
  );

  return (
    <>
      <MobileNavSettings navbar={navbar} onChange={onChange}/>
      <SettingGroup title="Menu bên — mobile">
       <label>Màu nền kính<input type="color" value={navbar.navStyles?.drawer?.background||'#fffafc'} onChange={e=>onChange({navStyles:{...navbar.navStyles,drawer:{...navbar.navStyles?.drawer,background:e.target.value}}})}/></label>
       {[['width','Chiều rộng menu (px)',290,240,360],['opacity','Độ đục (%)',82,40,100],['blur','Độ mờ nền (px)',24,0,32],['radius','Bo góc (px)',24,0,32]].map(([key,label,fallback,min,max])=><label key={key}>{label}<input type="number" min={min} max={max} value={navbar.navStyles?.drawer?.[key]??fallback} onChange={e=>onChange({navStyles:{...navbar.navStyles,drawer:{...navbar.navStyles?.drawer,[key]:Number(e.target.value)}}})}/></label>)}
       <StyleTypographyBlock title="Chữ menu bên" style={navbar.navStyles?.drawer?.text||{}} onStyleChange={patch=>onChange({navStyles:{...navbar.navStyles,drawer:{...navbar.navStyles?.drawer,text:{...navbar.navStyles?.drawer?.text,...patch}}}})}/>
      </SettingGroup>
      <SettingGroup title={isLogo ? "Logo" : `Link ${linkIndex + 1}`}>
        {isLogo ? (
          <div className="builder-field">
            <label>Chữ logo</label>
            <input
              value={navbar.navLogo || ""}
              onChange={(e) => onChange({ navLogo: e.target.value })}
            />
          </div>
        ) : (
          <>
            <div className="builder-field">
              <label>Chữ link</label>
              <input
                value={link.label || ""}
                onChange={(e) => onChange({ _linkIndex: linkIndex, _link: { label: e.target.value } })}
              />
            </div>
            <div className="builder-field">
              <label>Đường dẫn</label>
              <input
                value={link.href || ""}
                onChange={(e) => onChange({ _linkIndex: linkIndex, _link: { href: e.target.value } })}
              />
            </div>
            <small className="builder-help">
              Mặc định: Về Chúng Tôi → /#about, Sản phẩm → /#shop, Liên Hệ → /#contact (footer).
              Để trống hoặc "/" sẽ dùng link mặc định.
            </small>
            <small className="builder-help">Font, căn lề, margin và padding dùng chung cho mọi link.</small>
          </>
        )}
      </SettingGroup>
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
