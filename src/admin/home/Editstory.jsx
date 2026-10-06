import useHomeForm from "./Usehomeform";
import { Field, ItemCards, SectionShell } from "./Ui";
import ImageField from "../ImageField";

export default function EditStory() {
  const h = useHomeForm([
    "storyLabel",
    "storyTitle",
    "storyHighlight",
    "storyText",
    "storyImage",
    "storyStats",
  ]);

  return (
    <SectionShell
      title="Câu chuyện"
      hint="Nội dung, hình ảnh giới thiệu thương hiệu và các số liệu."
      {...h}
      onSubmit={h.save}
    >
      <Field
        label="Nhãn nhỏ"
        name="storyLabel"
        {...h}
      />

      <Field
        label="Tiêu đề"
        name="storyTitle"
        {...h}
      />

      <Field
        label="Chữ nổi bật"
        name="storyHighlight"
        {...h}
      />

      <Field
        label="Nội dung"
        name="storyText"
        rows="5"
        {...h}
      />

      <ImageField
        label="Ảnh phần Câu chuyện"
        value={h.form.storyImage ?? "/about.jpg"}
        onChange={(v) => h.set("storyImage", v)}
        width={2000}
      />

      <ItemCards
        title="Số liệu"
        listKey="storyStats"
        h={h}
        blank={{
          value: 0,
          suffix: "",
          label: "",
        }}
        fields={[
          {
            key: "value",
            label: "Số",
            number: true,
          },
          {
            key: "suffix",
            label: "Ký hiệu phía sau (+, %)",
          },
          {
            key: "label",
            label: "Mô tả",
          },
        ]}
      />
    </SectionShell>
  );
}