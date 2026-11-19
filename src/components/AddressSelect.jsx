import { memo, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
const normalize = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLocaleLowerCase("vi");
function AddressSelect({ label, value, options, onChange, disabled = false, loading = false, placeholder = "Chọn địa chỉ", required = false, name }) {
  const id = useId(); const ref = useRef(null); const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [active, setActive] = useState(0);
  const indexed = useMemo(() => options.map(item=>({item,search:normalize(`${item.name} ${item.code}`)})), [options]);
  const deferredQuery=useDeferredValue(query),needle=normalize(deferredQuery);
  const matches = useMemo(()=>open?indexed.filter(row=>row.search.includes(needle)).map(row=>row.item):[],[indexed,needle,open]);
  const selected = useMemo(()=>options.find(item=>item.code===value),[options,value]);
  const expanded = open && !disabled && !loading;
  const choose = (item) => { onChange(item.code); setOpen(false); setQuery(""); };
  useEffect(() => {
    if (!open) return;
    const doc = ref.current.ownerDocument;
    const outside = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    doc.addEventListener("pointerdown", outside);
    return () => doc.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (expanded) ref.current?.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: "nearest" });
  }, [active, expanded, deferredQuery]);
  return <div className="address-select" ref={ref} onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label htmlFor={id}>{label}</label>
    <div className="address-select-control"><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-busy={query!==deferredQuery} aria-controls={`${id}-options`} aria-activedescendant={expanded && matches[active] ? `${id}-option-${active}` : undefined} required={required} disabled={disabled || loading} autoComplete="off" placeholder={loading ? "Đang tải địa chỉ…" : placeholder} value={expanded ? query : selected?.name || ""} onFocus={() => { setOpen(true); setQuery(""); setActive(0); }} onClick={() => { if(!expanded){setOpen(true);setQuery("");setActive(0);} }} onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }} onKeyDown={(event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive((current) => !expanded || !matches.length ? 0 : (current + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length); }
      if (event.key === "Enter" && expanded) { event.preventDefault(); if (query===deferredQuery && matches[active]) choose(matches[active]); }
      if (event.key === "Escape" && expanded) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    }} /><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
    {name && <input type="hidden" name={name} value={value} />}
    {expanded && <div id={`${id}-options`} role="listbox" aria-label={label} className="address-select-options">{matches.map((item, index) => <button type="button" role="option" id={`${id}-option-${index}`} key={item.code} aria-selected={item.code === value} className={index === active ? "is-active" : ""} onPointerDown={(event) => event.preventDefault()} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)}><span>{item.name}</span>{item.meta && <small>{item.meta}</small>}{item.code === value && <span aria-hidden="true">✓</span>}</button>)}{!matches.length && <p>Không tìm thấy địa chỉ phù hợp.</p>}</div>}
  </div>;
}

export default memo(AddressSelect);
