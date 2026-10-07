import { useEffect, useMemo, useState } from "react";
import { getHomeContent, saveHomeContent } from "../../lib/api";
import About from "../../components/About";
import "./VisualBuilder.css";


const FONT_OPTIONS = [
  "Mulish",
  "Noto Sans",
  "Noto Serif",
  "Playfair Display",
  "Cormorant Garamond",
  "Montserrat",
  "Poppins",
  "Inter",
  "DM Sans",
  "Lora",
  "Roboto",
  "Arial",
  "Georgia",
  "Times New Roman",
];

const SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40,
  48, 56, 64, 72, 80, 96, 100,
];

const WEIGHT_OPTIONS = [
  300,
  400,
  500,
  600,
  700,
  800,
];

const LETTER_OPTIONS = [
  -2,
  -1,
  0,
  0.5,
  1,
  2,
  3,
  4,
  6,
];

const LINE_OPTIONS = [
  0.9,
  1,
  1.1,
  1.2,
  1.3,
  1.4,
  1.5,
  1.6,
  1.7,
  1.8,
  2,
];

const SPACE_OPTIONS = [
  0,
  4,
  8,
  12,
  16,
  20,
  24,
  32,
  40,
  48,
  60,
  80,
  100,
  120,
  140,
];

const DEFAULT_STYLE = {
  fontFamily: "Mulish",
  fontSize: 16,
  fontWeight: 400,
  color: "#3a1526",
  italic: false,
  letterSpacing: 0,
  lineHeight: 1.5,
  textAlign: "left",
  marginTop: 0,
  marginBottom: 0,
  paddingTop: 0,
  paddingBottom: 0,
  maxWidth: 100,
};

const DEFAULT_ABOUT = {
  section: {
    background: "#fffafc",
    paddingTop: 140,
    paddingBottom: 140,
    gap: 7,
  },

  label: {
    text: "CÂU CHUYỆN CỦA CHÚNG TÔI",
    style: {
      ...DEFAULT_STYLE,
      fontSize: 12,
      fontWeight: 500,
      color: "#b8446d",
      letterSpacing: 4,
      lineHeight: 1.2,
      textAlign: "left",
    },
  },

  title: {
    text: "Đẹp từ những điều",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Cormorant Garamond",
      fontSize: 80,
      fontWeight: 600,
      color: "#3a1526",
      letterSpacing: -2,
      lineHeight: 0.95,
      textAlign: "left",
    },
  },

  highlight: {
    text: "giản dị",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Cormorant Garamond",
      fontSize: 80,
      fontWeight: 400,
      color: "#e2678f",
      italic: true,
      letterSpacing: -2,
      lineHeight: 0.95,
      textAlign: "left",
    },
  },

  text: {
    text:
      "Chúng tôi bắt đầu từ mong muốn nhỏ: chọn lọc vài sản phẩm chăm sóc da thật sự hiệu quả, an toàn và dễ dùng mỗi ngày. Không quá nhiều bước, chỉ những điều cần thiết để bạn tự tin với làn da của mình.",
    style: {
      ...DEFAULT_STYLE,
      fontSize: 16,
      fontWeight: 300,
      color: "#755968",
      lineHeight: 1.85,
      textAlign: "left",
      maxWidth: 440,
    },
  },

  image: {
    src: "/about.jpg",
    width: 52,
    height: 620,
    radius: 200,
    borderWidth: 8,
  },

  stats: [
    {
      value: 5,
      suffix: "+",
      label: "Sản phẩm chọn lọc",
    },
    {
      value: 1000,
      suffix: "+",
      label: "Khách hàng yêu thích",
    },
    {
      value: 98,
      suffix: "%",
      label: "Hài lòng",
    },
  ],

  statValue: {
    ...DEFAULT_STYLE,
    fontFamily: "Cormorant Garamond",
    fontSize: 50,
    fontWeight: 600,
    color: "#b8446d",
    lineHeight: 1,
  },

  statLabel: {
    ...DEFAULT_STYLE,
    fontSize: 13,
    fontWeight: 400,
    color: "#755968",
    lineHeight: 1.4,
  },
};

const SECTION_LIST = [
  {
    key: "hero",
    label: "Hero",
    icon: "✦",
    disabled: true,
  },
  {
    key: "ticker",
    label: "Dải chữ chạy",
    icon: "↔",
    disabled: true,
  },
  {
    key: "about",
    label: "Câu chuyện",
    icon: "♡",
    active: true,
  },
  {
    key: "features",
    label: "Lý do chọn",
    icon: "✧",
    disabled: true,
  },
  {
    key: "steps",
    label: "Quy trình",
    icon: "03",
    disabled: true,
  },
  {
    key: "reviews",
    label: "Cảm nhận",
    icon: "❝",
    disabled: true,
  },
  {
    key: "newsletter",
    label: "Nhận tin",
    icon: "✉",
    disabled: true,
  },
  {
    key: "footer",
    label: "Footer",
    icon: "⌄",
    disabled: true,
  },
];

function mergeStyle(base, custom) {
  return {
    ...base,
    ...(custom || {}),
  };
}

function createAbout(data = {}) {
  const builder = data.aboutBuilder || {};

  return {
    ...DEFAULT_ABOUT,

    ...builder,

    section: {
      ...DEFAULT_ABOUT.section,
      ...(builder.section || {}),
    },

    label: {
      ...DEFAULT_ABOUT.label,
      text:
        builder.label?.text ??
        data.storyLabel ??
        DEFAULT_ABOUT.label.text,
      style: mergeStyle(
        DEFAULT_ABOUT.label.style,
        builder.label?.style || data.aboutStyles?.label
      ),
    },

    title: {
      ...DEFAULT_ABOUT.title,
      text:
        builder.title?.text ??
        data.storyTitle ??
        DEFAULT_ABOUT.title.text,
      style: mergeStyle(
        DEFAULT_ABOUT.title.style,
        builder.title?.style || data.aboutStyles?.title
      ),
    },

    highlight: {
      ...DEFAULT_ABOUT.highlight,
      text:
        builder.highlight?.text ??
        data.storyHighlight ??
        DEFAULT_ABOUT.highlight.text,
      style: mergeStyle(
        DEFAULT_ABOUT.highlight.style,
        builder.highlight?.style || data.aboutStyles?.highlight
      ),
    },

    text: {
      ...DEFAULT_ABOUT.text,
      text:
        builder.text?.text ??
        data.storyText ??
        DEFAULT_ABOUT.text.text,
      style: mergeStyle(
        DEFAULT_ABOUT.text.style,
        builder.text?.style || data.aboutStyles?.text
      ),
    },

    image: {
      ...DEFAULT_ABOUT.image,
      ...(builder.image || {}),
      src:
        builder.image?.src ??
        data.storyImage ??
        DEFAULT_ABOUT.image.src,
    },

    stats:
      builder.stats?.length
        ? builder.stats
        : data.storyStats?.length
        ? data.storyStats
        : DEFAULT_ABOUT.stats,

    statValue: mergeStyle(
      DEFAULT_ABOUT.statValue,
      builder.statValue || data.aboutStyles?.statValue
    ),

    statLabel: mergeStyle(
      DEFAULT_ABOUT.statLabel,
      builder.statLabel || data.aboutStyles?.statLabel
    ),
  };
}

export default function VisualBuilder() {
  const [home, setHome] = useState(null);
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [selected, setSelected] = useState("title");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;

    getHomeContent()
      .then((data) => {
        if (!alive) return;

        setHome(data || {});
        setAbout(createAbout(data || {}));
      })
      .catch((err) => {
        console.error(err);
        if (alive) {
          setHome({});
          setAbout(DEFAULT_ABOUT);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const selectedData = useMemo(
    () => getSelectedData(about, selected),
    [about, selected]
  );

  const updateSelected = (patch) => {
    setAbout((current) => {
      if (selected === "section") {
        return {
          ...current,
          section: {
            ...current.section,
            ...patch,
          },
        };
      }

      if (selected === "image") {
        return {
          ...current,
          image: {
            ...current.image,
            ...patch,
          },
        };
      }

      if (selected === "stats") {
        return {
          ...current,
          stats: patch,
        };
      }

      return {
        ...current,
        [selected]: {
          ...current[selected],
          ...patch,
        },
      };
    });
  };

  const updateSelectedStyle = (patch) => {
    setAbout((current) => {
      if (
        selected === "section" ||
        selected === "image" ||
        selected === "stats"
      ) {
        return current;
      }

      return {
        ...current,
        [selected]: {
          ...current[selected],
          style: {
            ...current[selected].style,
            ...patch,
          },
        },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        storyLabel: about.label.text,
        storyTitle: about.title.text,
        storyHighlight: about.highlight.text,
        storyText: about.text.text,
        storyImage: about.image.src,
        storyStats: about.stats,

        aboutBuilder: about,

        aboutStyles: {
          label: about.label.style,
          title: about.title.style,
          highlight: about.highlight.style,
          text: about.text.style,
          statValue: about.statValue,
          statLabel: about.statLabel,
        },
      };

      await saveHomeContent(payload);

      setHome((current) => ({
        ...(current || {}),
        ...payload,
      }));

      setMessage({
        type: "success",
        text: "Đã lưu toàn bộ thay đổi.",
      });
    } catch (err) {
      console.error(err);

      setMessage({
        type: "error",
        text:
          err?.code === "permission-denied"
            ? "Tài khoản này chưa có quyền chỉnh sửa."
            : err?.message || "Không thể lưu thay đổi.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="builder-loading">
        Đang tải Visual Builder...
      </div>
    );
  }

  return (
    <div className="visual-builder">
      <div className="builder-toolbar">
        <div>
          <strong>Visual Page Builder</strong>
          <span>
            Chọn một phần trên preview để chỉnh sửa.
          </span>
        </div>

        <div className="builder-toolbar-actions">
          {message && (
            <span
              className={
                message.type === "success"
                  ? "builder-message success"
                  : "builder-message error"
              }
            >
              {message.text}
            </span>
          )}

          <button
            type="button"
            className="admin-btn primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "💾 Lưu tất cả"}
          </button>
        </div>
      </div>

      <div className="builder-layout">
        <aside className="builder-sections">
          <div className="builder-panel-title">
            <span>Sections</span>
            <small>Trang chủ</small>
          </div>

          <div className="builder-section-list">
            {SECTION_LIST.map((section) => (
              <button
                key={section.key}
                type="button"
                disabled={section.disabled}
                className={[
                  "builder-section-item",
                  selected === section.key ? "active" : "",
                  section.disabled ? "disabled" : "",
                ].join(" ")}
                onClick={() => {
                  if (!section.disabled) {
                    setSelected("section");
                  }
                }}
              >
                <span className="builder-section-icon">
                  {section.icon}
                </span>

                <span className="builder-section-text">
                  <strong>{section.label}</strong>
                  <small>
                    {section.disabled
                      ? "Sắp có"
                      : "Đang chỉnh sửa"}
                  </small>
                </span>

                {section.active && (
                  <span className="builder-dot" />
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="builder-canvas">
          <div className="builder-canvas-head">
            <span>Preview</span>

            <span className="builder-device">
              Desktop
            </span>
          </div>

          <div className="builder-preview">
            <About
              preview
              previewData={about}
              selectedElement={selected}
              onSelect={setSelected}
            />
          </div>
        </main>

        <aside className="builder-settings">
          <StylePanel
            selected={selected}
            data={selectedData}
            about={about}
            onChange={updateSelected}
            onStyleChange={updateSelectedStyle}
          />
        </aside>
      </div>
    </div>
  );
}

function getSelectedData(about, selected) {
  if (selected === "section") {
    return {
      type: "section",
      data: about.section,
    };
  }

  if (selected === "image") {
    return {
      type: "image",
      data: about.image,
    };
  }

  if (selected === "stats") {
    return {
      type: "stats",
      data: about.stats,
    };
  }

  return {
    type: "text",
    data: about[selected],
  };
}

function StylePanel({
  selected,
  data,
  about,
  onChange,
  onStyleChange,
}) {
  if (!data) {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const titleMap = {
    section: "Phần Câu chuyện",
    label: "Nhãn nhỏ",
    title: "Tiêu đề",
    highlight: "Chữ nổi bật",
    text: "Nội dung",
    image: "Hình ảnh",
    stats: "Số liệu",
  };

  return (
    <div className="builder-settings-inner">
      <div className="builder-panel-title">
        <span>Properties</span>
        <small>{titleMap[selected] || selected}</small>
      </div>

      {data.type === "section" && (
        <SectionSettings
          data={data.data}
          onChange={onChange}
        />
      )}

      {data.type === "image" && (
        <ImageSettings
          data={data.data}
          onChange={onChange}
        />
      )}

      {data.type === "stats" && (
        <StatsSettings
          stats={about.stats}
          about={about}
          onChange={onChange}
        />
      )}

      {data.type === "text" && (
        <TextSettings
          selected={selected}
          data={data.data}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}
    </div>
  );
}

function SectionSettings({ data, onChange }) {
  return (
    <>
      <SettingGroup title="Nền">
        <ColorField
          label="Màu nền"
          value={data.background}
          onChange={(value) =>
            onChange({ background: value })
          }
        />
      </SettingGroup>

      <SettingGroup title="Khoảng cách">
        <SelectField
          label="Padding trên"
          value={data.paddingTop}
          options={SPACE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({ paddingTop: Number(value) })
          }
        />

        <SelectField
          label="Padding dưới"
          value={data.paddingBottom}
          options={SPACE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({ paddingBottom: Number(value) })
          }
        />

        <SelectField
          label="Khoảng cách cột"
          value={data.gap}
          options={[2, 4, 5, 6, 7, 8, 10, 12]}
          suffix="%"
          onChange={(value) =>
            onChange({ gap: Number(value) })
          }
        />
      </SettingGroup>
    </>
  );
}

function ImageSettings({ data, onChange }) {
  return (
    <>
      <SettingGroup title="Ảnh">
        <div className="builder-field">
          <label>URL hình ảnh</label>
          <input
            value={data.src || ""}
            onChange={(e) =>
              onChange({ src: e.target.value })
            }
            placeholder="/about.jpg"
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Kích thước">
        <SelectField
          label="Chiều rộng"
          value={data.width}
          options={[40, 45, 48, 50, 52, 55, 60]}
          suffix="%"
          onChange={(value) =>
            onChange({ width: Number(value) })
          }
        />

        <SelectField
          label="Chiều cao"
          value={data.height}
          options={[400, 450, 500, 550, 600, 620, 650, 700, 750, 800]}
          suffix="px"
          onChange={(value) =>
            onChange({ height: Number(value) })
          }
        />

        <SelectField
          label="Bo góc"
          value={data.radius}
          options={[0, 20, 28, 40, 60, 100, 140, 180, 200]}
          suffix="px"
          onChange={(value) =>
            onChange({ radius: Number(value) })
          }
        />

        <SelectField
          label="Viền"
          value={data.borderWidth}
          options={[0, 2, 4, 6, 8, 10]}
          suffix="px"
          onChange={(value) =>
            onChange({ borderWidth: Number(value) })
          }
        />
      </SettingGroup>
    </>
  );
}

function StatsSettings({ stats, about, onChange }) {
  return (
    <>
      <SettingGroup title="Kiểu số">
        <TypographyControls
          style={about.statValue}
          onChange={(patch) =>
            onChange({
              ...about.statValue,
              ...patch,
            })
          }
        />
      </SettingGroup>

      <SettingGroup title="Kiểu mô tả">
        <TypographyControls
          style={about.statLabel}
          onChange={(patch) =>
            onChange({
              ...about.statLabel,
              ...patch,
            })
          }
        />
      </SettingGroup>

      <SettingGroup title="Nội dung">
        {stats.map((item, index) => (
          <div className="builder-stat-edit" key={index}>
            <div className="builder-stat-number">
              #{index + 1}
            </div>

            <div className="builder-field-row">
              <div className="builder-field">
                <label>Số</label>
                <input
                  type="number"
                  value={item.value ?? ""}
                  onChange={(e) => {
                    const next = [...stats];
                    next[index] = {
                      ...next[index],
                      value:
                        Number(e.target.value) || 0,
                    };
                    onChange(next);
                  }}
                />
              </div>

              <div className="builder-field">
                <label>Ký hiệu</label>
                <input
                  value={item.suffix || ""}
                  onChange={(e) => {
                    const next = [...stats];
                    next[index] = {
                      ...next[index],
                      suffix: e.target.value,
                    };
                    onChange(next);
                  }}
                />
              </div>
            </div>

            <div className="builder-field">
              <label>Mô tả</label>
              <input
                value={item.label || ""}
                onChange={(e) => {
                  const next = [...stats];
                  next[index] = {
                    ...next[index],
                    label: e.target.value,
                  };
                  onChange(next);
                }}
              />
            </div>
          </div>
        ))}
      </SettingGroup>
    </>
  );
}

function TextSettings({
  selected,
  data,
  onChange,
  onStyleChange,
}) {
  return (
    <>
      <SettingGroup title="Nội dung">
        <div className="builder-field">
          <label>
            {selected === "text"
              ? "Nội dung"
              : "Văn bản"}
          </label>

          <textarea
            rows={selected === "text" ? 7 : 4}
            value={data.text || ""}
            onChange={(e) =>
              onChange({
                text: e.target.value,
              })
            }
            placeholder="Nhập nội dung..."
          />

          <small className="builder-help">
            Nhấn Enter để xuống dòng.
          </small>
        </div>
      </SettingGroup>

      <SettingGroup title="Typography">
        <TypographyControls
          style={data.style}
          onChange={onStyleChange}
        />
      </SettingGroup>
    </>
  );
}

function TypographyControls({ style, onChange }) {
  return (
    <>
      <SelectField
        label="Font"
        value={style.fontFamily}
        options={FONT_OPTIONS}
        onChange={(value) =>
          onChange({ fontFamily: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Size"
          value={style.fontSize}
          options={SIZE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({
              fontSize: Number(value),
            })
          }
        />

        <SelectField
          label="Weight"
          value={style.fontWeight}
          options={WEIGHT_OPTIONS}
          onChange={(value) =>
            onChange({
              fontWeight: Number(value),
            })
          }
        />
      </div>

      <ColorField
        label="Màu chữ"
        value={style.color}
        onChange={(value) =>
          onChange({ color: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Letter spacing"
          value={style.letterSpacing}
          options={LETTER_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({
              letterSpacing: Number(value),
            })
          }
        />

        <SelectField
          label="Line height"
          value={style.lineHeight}
          options={LINE_OPTIONS}
          onChange={(value) =>
            onChange({
              lineHeight: Number(value),
            })
          }
        />
      </div>

      <div className="builder-field">
        <label>Căn lề</label>

        <div className="builder-align">
          {[
            ["left", "≡"],
            ["center", "≡"],
            ["right", "≡"],
            ["justify", "☰"],
          ].map(([value, icon]) => (
            <button
              key={value}
              type="button"
              className={
                style.textAlign === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChange({
                  textAlign: value,
                })
              }
              title={value}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-field">
        <label>Kiểu chữ</label>

        <button
          type="button"
          className={`builder-toggle ${
            style.italic ? "active" : ""
          }`}
          onClick={() =>
            onChange({
              italic: !style.italic,
            })
          }
        >
          <i>I</i> Italic
        </button>
      </div>

      <SettingGroup title="Spacing">
        <div className="builder-field-row">
          <SelectField
            label="Margin trên"
            value={style.marginTop}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                marginTop: Number(value),
              })
            }
          />

          <SelectField
            label="Margin dưới"
            value={style.marginBottom}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                marginBottom: Number(value),
              })
            }
          />
        </div>

        <div className="builder-field-row">
          <SelectField
            label="Padding trên"
            value={style.paddingTop}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                paddingTop: Number(value),
              })
            }
          />

          <SelectField
            label="Padding dưới"
            value={style.paddingBottom}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                paddingBottom: Number(value),
              })
            }
          />
        </div>

        <SelectField
          label="Max width"
          value={style.maxWidth}
          options={[
            30,
            40,
            50,
            60,
            70,
            80,
            90,
            100,
          ]}
          suffix="%"
          onChange={(value) =>
            onChange({
              maxWidth: Number(value),
            })
          }
        />
      </SettingGroup>
    </>
  );
}

function SettingGroup({ title, children }) {
  return (
    <div className="builder-setting-group">
      <h3>{title}</h3>
      <div className="builder-setting-content">
        {children}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  suffix = "",
  onChange,
}) {
  return (
    <div className="builder-field">
      <label>{label}</label>

      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={String(option)} value={option}>
            {option}
            {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="builder-color-field">
      <div>
        <label>{label}</label>
        <span>{value}</span>
      </div>

      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}