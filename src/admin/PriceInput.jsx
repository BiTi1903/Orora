import { useId } from "react";
import { parseVndPrice, priceInputValue } from "../lib/commerce";

export default function PriceInput({ value, onChange, ...props }) {
  const unitId = useId();
  return <div className="admin-money-input"><input {...props} aria-describedby={[props["aria-describedby"], unitId].filter(Boolean).join(" ")} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={priceInputValue(value)} onChange={(event) => { if (/^\d*$/.test(event.target.value)) onChange(event.target.value); }} onPaste={(event) => {
    event.preventDefault();
    const amount = parseVndPrice(event.clipboardData?.getData("text") || "");
    if (amount !== null) onChange(String(amount));
  }} /><span id={unitId} aria-label="Đơn vị: đồng">đ</span></div>;
}
