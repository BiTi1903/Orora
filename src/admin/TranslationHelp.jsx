import {useId, useState} from "react";
import "./translation-help.css";

export default function TranslationHelp({label, children}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <span className="translation-help" data-open={open} onBlur={() => setOpen(false)}>
    <button type="button" aria-label={`Hướng dẫn ${label}`} aria-describedby={id}
      aria-expanded={open} onClick={()=>setOpen(!open)}
      onKeyDown={event => {if (event.key === "Escape") {setOpen(false); event.currentTarget.blur();}}}>i</button>
    <span id={id} className="translation-help-copy" role="tooltip">{children}</span>
  </span>;
}
