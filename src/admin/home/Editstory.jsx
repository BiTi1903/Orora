import useHomeForm from "./Usehomeform";
import { Field, ItemCards, SectionShell } from "./Ui";
import ImageField from "../ImageField";

const FONT_OPTIONS = [
  { label: "Mulish", value: '"Mulish", sans-serif' },
  { label: "Noto Sans", value: '"Noto Sans", sans-serif' },
  { label: "Noto Serif", value: '"Noto Serif", serif' },
  { label: "Playfair Display", value: '"Playfair Display", serif' },
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", serif' },
  { label: "Montserrat", value: '"Montserrat", sans-serif' },
  { label: "Poppins", value: '"Poppins", sans-serif' },
  { label: "Inter", value: '"Inter", sans-serif' },
  { label: "DM Sans", value: '"DM Sans", sans-serif' },
  { label: "Lora", value: '"Lora", serif' },
  { label: "Roboto", value: '"Roboto", sans-serif' },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
];

const SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 100,
];

const WEIGHT_OPTIONS = [
  { label: "300 - Light", value: 300 },
  { label: "400 - Regular", value: 400 },
  { label: "500 - Medium", value: 500 },
  { label: "600 - Semi Bold", value: 600 },
  { label: "700 - Bold", value: 700 },
  { label: "800 - Extra Bold", value: 800 },
];

const LETTER_SPACING_OPTIONS = [
  { label: "-2px", value: "-2px" },
  { label: "-1px", value: "-1px" },
  { label: "-0.5px", value: "-0.5px" },
  { label: "0px", value: "0px" },
  { label: "0.5px", value: "0.5px" },
  { label: "1px", value: "1px" },
  { label: "2px", value: "2px" },
  { label: "3px", value: "3px" },
  { label: "4px", value: "4px" },
];

const LINE_HEIGHT_OPTIONS = [
  { label: "1.0", value: 1 },
  { label: "1.1", value: 1.1 },
  { label: "1.2", value: 1.2 },
  { label: "1.3", value: 1.3 },
  { label: "1.4", value: 1.4 },
  { label: "1.5", value: 1.5 },
  { label: "1.6", value: 1.6 },
  { label: "1.7", value: 1.7 },
  { label: "1.8", value: 1.8 },
  { label: "1.9", value: 1.9 },
  { label: "2.0", value: 2 },
];

const DEFAULT_ABOUT_STYLES = {
  label: {
    fontFamily: '"Mulish", sans-serif',
    fontSize: 12,
    fontWeight: 500,
    color: "#B8446D",
    letterSpacing: "4px",
    lineHeight: 1.2,
    fontStyle: "normal",
  },

  title: {
    fontFamily: '"Playfair Display", serif',
    fontSize: 80,
    fontWeight: 600,
    color: "#321525",
    letterSpacing: "-2px",
    lineHeight: 0.95,
    fontStyle: "normal",
  },

  highlight: {
    fontFamily: '"Playfair Display", serif',
    fontSize: 80,
    fontWeight: 400,
    color: "#D96B92",
    letterSpacing: "-2px",
    lineHeight: 0.95,
    fontStyle: "italic",
  },

  text: {
    fontFamily: '"Mulish", sans-serif',
    fontSize: 16,
    fontWeight: 300,
    color: "#6F5A66",
    letterSpacing: "0px",
    lineHeight: 1.85,
    fontStyle: "normal",
  },

  statValue: {
    fontFamily: '"Playfair Display", serif',
    fontSize: 50,
    fontWeight: 600,
    color: "#B8446D",
    letterSpacing: "0px",
    lineHeight: 1,
    fontStyle: "normal",
  },

  statLabel: {
    fontFamily: '"Mulish", sans-serif',
    fontSize: 13,
    fontWeight: 400,
    color: "#6F5A66",
    letterSpacing: "0px",
    lineHeight: 1.3,
    fontStyle: "normal",
  },
};

function SelectControl({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
        minWidth: 0,
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#6f5361",
        }}
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 42,
          padding: "0 12px",
          border: "1px solid #ead9e0",
          borderRadius: 10,
          background: "#fff",
          color: "#321525",
          fontSize: 13,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#6f5361",
        }}
      >
        {label}
      </label>

      <div
        style={{
          height: 42,
          padding: "4px 8px",
          border: "1px solid #ead9e0",
          borderRadius: 10,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 32,
            height: 32,
            padding: 0,
            border: 0,
            background: "transparent",
            cursor: "pointer",
          }}
        />

        <span
          style={{
            fontSize: 12,
            color: "#6f5361",
            textTransform: "uppercase",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StyleEditor({
  title,
  value,
  onChange,
  showItalic = true,
}) {
  const style = {
    ...DEFAULT_ABOUT_STYLES.title,
    ...(value || {}),
  };

  const update = (key, nextValue) => {
    onChange({
      ...style,
      [key]: nextValue,
    });
  };

  return (
    <div
      style={{
        marginTop: 14,
        padding: 18,
        border: "1px solid #ead9e0",
        borderRadius: 14,
        background: "#fffafd",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#321525",
          marginBottom: 14,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <SelectControl
          label="Font"
          value={style.fontFamily}
          onChange={(v) => update("fontFamily", v)}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </SelectControl>

        <SelectControl
          label="Size"
          value={style.fontSize}
          onChange={(v) => update("fontSize", Number(v))}
        >
          {SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </SelectControl>

        <SelectControl
          label="Độ đậm"
          value={style.fontWeight}
          onChange={(v) => update("fontWeight", Number(v))}
        >
          {WEIGHT_OPTIONS.map((weight) => (
            <option key={weight.value} value={weight.value}>
              {weight.label}
            </option>
          ))}
        </SelectControl>

        <ColorControl
          label="Màu chữ"
          value={style.color}
          onChange={(v) => update("color", v)}
        />

        <SelectControl
          label="Khoảng cách chữ"
          value={style.letterSpacing}
          onChange={(v) => update("letterSpacing", v)}
        >
          {LETTER_SPACING_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectControl>

        <SelectControl
          label="Chiều cao dòng"
          value={style.lineHeight}
          onChange={(v) => update("lineHeight", Number(v))}
        >
          {LINE_HEIGHT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectControl>

        {showItalic && (
          <SelectControl
            label="Kiểu chữ"
            value={style.fontStyle}
            onChange={(v) => update("fontStyle", v)}
          >
            <option value="normal">Bình thường</option>
            <option value="italic">Nghiêng</option>
          </SelectControl>
        )}
      </div>
    </div>
  );
}

export default function EditStory() {
  const h = useHomeForm([
    "storyLabel",
    "storyTitle",
    "storyHighlight",
    "storyText",
    "storyImage",
    "storyStats",
    "aboutStyles",
  ]);

  const styles = {
    ...DEFAULT_ABOUT_STYLES,
    ...(h.form.aboutStyles || {}),
  };

  const updateStyle = (key, value) => {
    h.set("aboutStyles", {
      ...styles,
      [key]: value,
    });
  };

  return (
    <SectionShell
      title="Câu chuyện"
      hint="Nội dung, hình ảnh và kiểu chữ của phần Câu chuyện."
      {...h}
      onSubmit={h.save}
    >
      <Field
        label="Nhãn nhỏ"
        name="storyLabel"
        {...h}
      />

      <StyleEditor
        title="Kiểu chữ — Nhãn nhỏ"
        value={styles.label}
        onChange={(v) => updateStyle("label", v)}
        showItalic={false}
      />

      <Field
        label="Tiêu đề"
        name="storyTitle"
        {...h}
      />

      <StyleEditor
        title="Kiểu chữ — Tiêu đề"
        value={styles.title}
        onChange={(v) => updateStyle("title", v)}
      />

      <Field
        label="Chữ nổi bật"
        name="storyHighlight"
        {...h}
      />

      <StyleEditor
        title="Kiểu chữ — Chữ nổi bật"
        value={styles.highlight}
        onChange={(v) => updateStyle("highlight", v)}
      />

      <Field
        label="Nội dung"
        name="storyText"
        rows="5"
        {...h}
      />

      <StyleEditor
        title="Kiểu chữ — Nội dung"
        value={styles.text}
        onChange={(v) => updateStyle("text", v)}
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

      <StyleEditor
        title="Kiểu chữ — Số lớn"
        value={styles.statValue}
        onChange={(v) => updateStyle("statValue", v)}
      />

      <StyleEditor
        title="Kiểu chữ — Mô tả số liệu"
        value={styles.statLabel}
        onChange={(v) => updateStyle("statLabel", v)}
        showItalic={false}
      />
    </SectionShell>
  );
}