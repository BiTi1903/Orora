import { useEffect, useState } from "react";
import useHomeForm from "./Usehomeform";
import { toLines } from "./Defaults";
import { SectionShell } from "./Ui";

export default function EditTicker() {
  const h = useHomeForm(["marqueeWords"]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!h.loading) setText((h.form.marqueeWords || []).join("\n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h.loading]);

  return (
    <SectionShell
      title="Dải chữ chạy"
      hint="Các câu chạy ngang dưới phần Hero."
      {...h}
      onSubmit={(e) => h.save(e, { marqueeWords: toLines(text) })}
    >
      <div className="admin-field">
        <label>Nội dung (mỗi dòng một câu)</label>
        <textarea rows="7" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
    </SectionShell>
  );
}