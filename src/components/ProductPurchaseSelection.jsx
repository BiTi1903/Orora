import "../styles/purchase-selection.css";
import { useId } from "react";
import { MAX_ORDER_QUANTITY } from "../lib/product-options";
import { useLocale, translatePhrase } from "../lib/i18n";
export default function ProductPurchaseSelection({ options, variantId, quantity, onVariantChange, onQuantityChange, disabled = false, quantityDisabled = disabled, required = false, textProps = () => ({}), labels = {}, showHelp = true }) {
  const id = useId();
  const locale = useLocale();
  const isAdmin = typeof window !== "undefined" && window.location?.pathname?.startsWith("/admin");
  const tr = (val) => (!isAdmin && locale !== "vi" ? translatePhrase(val, locale) : val);
  const changeQuantity = (amount) => onQuantityChange(Math.min(MAX_ORDER_QUANTITY, Math.max(1, (Number(quantity) || 1) + amount)));
  return <div className="product-purchase-selection">
    {options.length > 0 && <fieldset className="product-volume-options" disabled={disabled}><legend {...textProps("pdSelectionLabel", "selectionLabel")}>{tr(labels.volume ?? "Dung tích")}</legend><div className="product-volume-choices">{options.map((option) => <label className={`product-volume-choice${variantId === option.id ? " is-selected" : ""}`} key={option.id}><input type="radio" name={`${id}-volume`} value={option.id} checked={variantId === option.id} required={required} onChange={() => onVariantChange(option.id)} /><span {...textProps("pdSelectionValue", "selectionValue")}>{option.label}</span></label>)}</div>{showHelp && options.length > 1 && <p className={`product-selection-help${variantId ? " is-reserved" : ""}`} aria-hidden={Boolean(variantId)}>{tr(labels.help ?? "Chọn dung tích muốn đặt.")}</p>}</fieldset>}
    <div className="product-quantity-row"><label htmlFor={`${id}-quantity`} {...textProps("pdSelectionLabel", "selectionLabel")}>{tr(labels.quantity ?? "Số lượng")}</label><div className="product-quantity-control"><button type="button" aria-label={tr("Giảm số lượng")} disabled={quantityDisabled || Number(quantity) <= 1} onClick={() => changeQuantity(-1)}>−</button><input id={`${id}-quantity`} name="quantity" type="number" inputMode="numeric" min={1} max={MAX_ORDER_QUANTITY} required disabled={quantityDisabled} value={quantity} onChange={(event) => onQuantityChange(event.target.value === "" ? "" : Math.min(MAX_ORDER_QUANTITY, Math.max(1, Math.trunc(Number(event.target.value)) || 1)))} onBlur={() => { if (quantity === "") onQuantityChange(1); }} /><button type="button" aria-label={tr("Tăng số lượng")} disabled={quantityDisabled || Number(quantity) >= MAX_ORDER_QUANTITY} onClick={() => changeQuantity(1)}>+</button></div></div>
  </div>;
}
