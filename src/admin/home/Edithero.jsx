import { useEffect, useState } from "react";
import ImageField from "../ImageField";

import useHomeForm from "./Usehomeform";
import { toLines } from "./Defaults";
import { Field, SectionShell } from "./Ui";

const FIELDS = [
  "heroEyebrow",
  "heroTitle",
  "heroDescription",
  "heroButtonText",
  "heroButtonLink",
  "shopButtonText",
  "shopButtonLink",
  "heroImage",
  "heroRotator",
];

export default function EditHero() {
  const h = useHomeForm(FIELDS);

  const { form, loading } = h;

  const [rotator, setRotator] = useState("");

  useEffect(() => {
    if (!loading) {
      setRotator(
        (form.heroRotator || []).join("\n")
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <SectionShell
      title="Hero (đầu trang)"
      hint="Chữ, nút và ảnh nền ở đầu trang."
      {...h}
      onSubmit={(e) =>
        h.save(e, {
          heroRotator: toLines(rotator),
        })
      }
    >
      <Field
        label="Dòng nhỏ phía trên"
        name="heroEyebrow"
        {...h}
      />

      <Field
        label="Tiêu đề lớn"
        name="heroTitle"
        {...h}
      />

      <Field
        label="Mô tả ngắn"
        name="heroDescription"
        {...h}
      />

      <Field
        label="Chữ nút chính"
        name="heroButtonText"
        {...h}
      />

      <Field
        label="Liên kết nút chính"
        name="heroButtonLink"
        {...h}
      />

      <Field
        label="Chữ nút phụ"
        name="shopButtonText"
        {...h}
      />

      <Field
        label="Liên kết nút phụ"
        name="shopButtonLink"
        {...h}
      />

      <ImageField
        label="Ảnh nền phần đầu trang"
        value={form.heroImage ?? "/hero.jpg"}
        onChange={(v) =>
          h.set("heroImage", v)
        }
        width={2000}
      />

      <div className="admin-field">
        <label>
          Các từ đổi liên tục (mỗi dòng một từ)
        </label>

        <textarea
          rows="5"
          value={rotator}
          onChange={(e) =>
            setRotator(e.target.value)
          }
        />
      </div>
    </SectionShell>
  );
}