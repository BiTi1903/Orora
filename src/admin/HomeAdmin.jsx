import { useEffect, useState } from "react";
import { defaultHomeContent } from "../data/content";
import {
  explainError,
  getHomeContent,
  saveHomeContent,
} from "../lib/api";
import ImageField from "./ImageField";

const defaultExtras = {
  marqueeWords: [
    "Dịu nhẹ cho da",
    "Thành phần thuần khiết",
    "Không paraben",
    "Cấp ẩm sâu",
    "Rạng rỡ mỗi ngày",
  ],

  featuresLabel: "ORORA",
  featuresTitle: "Nâng cấp bản thân",
  features: [
    {
      icon: "❀",
      title: "Thành phần lành tính",
      text: "Công thức ưu tiên chiết xuất thiên nhiên, phù hợp cả làn da nhạy cảm.",
    },
    {
      icon: "☾",
      title: "Cấp ẩm suốt ngày dài",
      text: "Thấm nhanh, không bết dính, để da mềm mượt từ sáng đến tối.",
    },
    {
      icon: "✧",
      title: "Hương thơm thanh tao",
      text: "Mùi hương nhẹ nhàng như một khoảnh khắc thư giãn cho riêng bạn.",
    },
    {
      icon: "♡",
      title: "Đóng gói tinh tế",
      text: "Thiết kế xinh xắn, làm quà tặng cho chính mình hay người thương đều đẹp.",
    },
  ],

  storyLabel: "CÂU CHUYỆN CỦA CHÚNG TÔI",
  storyTitle: "Đẹp từ những điều",
  storyHighlight: "giản dị",
  storyText:
    "Chúng tôi bắt đầu từ mong muốn nhỏ: chọn lọc vài sản phẩm chăm sóc da thật sự hiệu quả, an toàn và dễ dùng mỗi ngày. Không quá nhiều bước, chỉ những điều cần thiết để bạn tự tin với làn da của mình.",
  storyStats: [
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

  ritualLabel: "QUY TRÌNH ĐƠN GIẢN",
  ritualTitle: "3 bước cho làn da",
  ritualHighlight: "rạng rỡ",
  steps: [
    {
      n: "01",
      t: "Làm sạch",
      d: "Loại bỏ bụi bẩn và dầu thừa nhẹ nhàng.",
    },
    {
      n: "02",
      t: "Dưỡng ẩm",
      d: "Nuôi dưỡng da căng mọng, mềm mại.",
    },
    {
      n: "03",
      t: "Bảo vệ",
      d: "Giữ làn da khỏe trước tác động môi trường.",
    },
  ],

  testimonialsLabel: "CẢM NHẬN",
  testimonialsTitle: "Được",
  testimonialsHighlight: "yêu thích",
  testimonialsTitleEnd: "bởi những cô nàng như bạn",
  reviews: [
    {
      name: "Khách hàng A",
      text: "Da mình mềm và dịu hơn hẳn sau vài tuần dùng. Mùi hương rất dễ chịu.",
    },
    {
      name: "Khách hàng B",
      text: "Bao bì xinh, dùng lên không bết dính. Mình đã mua tặng bạn thân.",
    },
    {
      name: "Khách hàng C",
      text: "Sản phẩm nhẹ nhàng, phù hợp da nhạy cảm như mình.",
    },
  ],

  newsletterTitle: "Nhận ưu đãi",
  newsletterHighlight: "ngay",
  newsletterText:
    "Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn.",

  footerLogo: "ORORA",
  footerDescription: "Chăm sóc làn da, nuôi dưỡng sự tự tin.",
  footerInstagram: "#",
  footerFacebook: "#",
  footerTikTok: "#",
  footerCopyright: "© 2026 ORORA. All rights reserved.",
};

const mergeExtras = (data) => ({
  ...defaultExtras,
  ...data,
  features: data?.features?.length
    ? data.features
    : defaultExtras.features,
  storyStats: data?.storyStats?.length
    ? data.storyStats
    : defaultExtras.storyStats,
  steps: data?.steps?.length
    ? data.steps
    : defaultExtras.steps,
  reviews: data?.reviews?.length
    ? data.reviews
    : defaultExtras.reviews,
  marqueeWords: data?.marqueeWords?.length
    ? data.marqueeWords
    : defaultExtras.marqueeWords,
});

export default function HomeAdmin() {
  const [form, setForm] = useState({
    ...defaultHomeContent,
    ...defaultExtras,
  });

  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const [rotatorText, setRotatorText] = useState(
    (defaultHomeContent.heroRotator || []).join("\n")
  );

  const [marqueeText, setMarqueeText] = useState(
    defaultExtras.marqueeWords.join("\n")
  );

  useEffect(() => {
    getHomeContent()
      .then((v) => {
        if (!v) return;

        const merged = {
          ...defaultHomeContent,
          ...defaultExtras,
          ...v,
          ...mergeExtras(v),
        };

        setForm(merged);

        setRotatorText(
          (merged.heroRotator || []).join("\n")
        );

        setMarqueeText(
          (merged.marqueeWords || []).join("\n")
        );
      })
      .catch(() => {});
  }, []);

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const updateArrayItem = (arrayName, index, key, value) => {
    setForm((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const heroRotator = rotatorText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

      const marqueeWords = marqueeText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

      await saveHomeContent({
        ...form,
        heroRotator,
        marqueeWords,
      });

      setForm((f) => ({
        ...f,
        heroRotator,
        marqueeWords,
      }));

      setMessage({
        type: "success",
        text: "Đã lưu nội dung trang chủ.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: explainError(err),
      });
    }

    setBusy(false);
  };

  return (
    <section>
      <h1>Trang chủ</h1>

      <p className="admin-muted">
        Chỉnh sửa nội dung trang chủ mà không cần sửa code.
      </p>

      {message && (
        <div
          className={`admin-${message.type}`}
          style={{ margin: "16px 0" }}
        >
          {message.text}
        </div>
      )}

      <form
        className="admin-card admin-form"
        onSubmit={save}
        style={{ marginTop: 16 }}
      >
        {/* ================= HERO ================= */}

        <h2>Hero</h2>

        {[
          ["heroEyebrow", "Dòng nhỏ phía trên"],
          ["heroTitle", "Tiêu đề lớn"],
          ["heroDescription", "Mô tả ngắn"],
          ["heroButtonText", "Chữ nút chính"],
          ["heroButtonLink", "Liên kết nút chính"],
          ["shopButtonText", "Chữ nút phụ"],
          ["shopButtonLink", "Liên kết nút phụ"],
        ].map(([key, label]) => (
          <div className="admin-field" key={key}>
            <label>{label}</label>
            <input
              name={key}
              value={form[key] || ""}
              onChange={change}
            />
          </div>
        ))}

        <ImageField
          label="Ảnh nền phần đầu trang (Hero)"
          value={form.heroImage ?? "/hero.jpg"}
          onChange={(v) =>
            setForm({
              ...form,
              heroImage: v,
            })
          }
          width={2000}
        />

        <div className="admin-field">
          <label>
            Các từ đổi liên tục trong Hero
          </label>

          <textarea
            rows="5"
            value={rotatorText}
            onChange={(e) =>
              setRotatorText(e.target.value)
            }
          />
        </div>

        {/* ================= MARQUEE ================= */}

        <hr />

        <h2>Dải chữ chạy</h2>

        <div className="admin-field">
          <label>
            Nội dung dải chữ — mỗi dòng một câu
          </label>

          <textarea
            rows="6"
            value={marqueeText}
            onChange={(e) =>
              setMarqueeText(e.target.value)
            }
          />
        </div>

        {/* ================= FEATURES ================= */}

        <hr />

        <h2>Lý do chọn</h2>

        <div className="admin-field">
          <label>Nhãn nhỏ</label>
          <input
            name="featuresLabel"
            value={form.featuresLabel || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Tiêu đề</label>
          <input
            name="featuresTitle"
            value={form.featuresTitle || ""}
            onChange={change}
          />
        </div>

        {form.features.map((item, i) => (
          <div className="admin-card" key={i}>
            <h3>Ô {i + 1}</h3>

            <div className="admin-field">
              <label>Icon</label>
              <input
                value={item.icon || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "features",
                    i,
                    "icon",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Tiêu đề</label>
              <input
                value={item.title || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "features",
                    i,
                    "title",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Nội dung</label>
              <textarea
                rows="3"
                value={item.text || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "features",
                    i,
                    "text",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}

        {/* ================= STORY ================= */}

        <hr />

        <h2>Câu chuyện</h2>

        <div className="admin-field">
          <label>Nhãn nhỏ</label>
          <input
            name="storyLabel"
            value={form.storyLabel || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Tiêu đề</label>
          <input
            name="storyTitle"
            value={form.storyTitle || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Chữ nổi bật</label>
          <input
            name="storyHighlight"
            value={form.storyHighlight || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Nội dung</label>
          <textarea
            rows="5"
            name="storyText"
            value={form.storyText || ""}
            onChange={change}
          />
        </div>

        {form.storyStats.map((item, i) => (
          <div className="admin-card" key={i}>
            <h3>Số liệu {i + 1}</h3>

            <div className="admin-field">
              <label>Số</label>
              <input
                type="number"
                value={item.value ?? ""}
                onChange={(e) =>
                  updateArrayItem(
                    "storyStats",
                    i,
                    "value",
                    Number(e.target.value)
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Ký hiệu phía sau</label>
              <input
                value={item.suffix || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "storyStats",
                    i,
                    "suffix",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Mô tả</label>
              <input
                value={item.label || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "storyStats",
                    i,
                    "label",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}

        {/* ================= RITUAL ================= */}

        <hr />

        <h2>Quy trình</h2>

        <div className="admin-field">
          <label>Nhãn nhỏ</label>
          <input
            name="ritualLabel"
            value={form.ritualLabel || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Tiêu đề</label>
          <input
            name="ritualTitle"
            value={form.ritualTitle || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Chữ nổi bật</label>
          <input
            name="ritualHighlight"
            value={form.ritualHighlight || ""}
            onChange={change}
          />
        </div>

        {form.steps.map((item, i) => (
          <div className="admin-card" key={i}>
            <h3>Bước {i + 1}</h3>

            <div className="admin-field">
              <label>Số</label>
              <input
                value={item.n || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "steps",
                    i,
                    "n",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Tiêu đề</label>
              <input
                value={item.t || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "steps",
                    i,
                    "t",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Mô tả</label>
              <textarea
                rows="3"
                value={item.d || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "steps",
                    i,
                    "d",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}

        {/* ================= REVIEWS ================= */}

        <hr />

        <h2>Cảm nhận</h2>

        <div className="admin-field">
          <label>Nhãn nhỏ</label>
          <input
            name="testimonialsLabel"
            value={form.testimonialsLabel || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Tiêu đề trước chữ nổi bật</label>
          <input
            name="testimonialsTitle"
            value={form.testimonialsTitle || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Chữ nổi bật</label>
          <input
            name="testimonialsHighlight"
            value={form.testimonialsHighlight || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Phần tiêu đề phía sau</label>
          <input
            name="testimonialsTitleEnd"
            value={form.testimonialsTitleEnd || ""}
            onChange={change}
          />
        </div>

        {form.reviews.map((item, i) => (
          <div className="admin-card" key={i}>
            <h3>Đánh giá {i + 1}</h3>

            <div className="admin-field">
              <label>Tên khách hàng</label>
              <input
                value={item.name || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "reviews",
                    i,
                    "name",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="admin-field">
              <label>Nội dung</label>
              <textarea
                rows="3"
                value={item.text || ""}
                onChange={(e) =>
                  updateArrayItem(
                    "reviews",
                    i,
                    "text",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}

        {/* ================= NEWSLETTER ================= */}

        <hr />

        <h2>Đăng ký nhận tin</h2>

        <div className="admin-field">
          <label>Tiêu đề</label>
          <input
            name="newsletterTitle"
            value={form.newsletterTitle || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Chữ nổi bật</label>
          <input
            name="newsletterHighlight"
            value={form.newsletterHighlight || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Mô tả</label>
          <textarea
            rows="3"
            name="newsletterText"
            value={form.newsletterText || ""}
            onChange={change}
          />
        </div>

        {/* ================= FOOTER ================= */}

        <hr />

        <h2>Footer</h2>

        <div className="admin-field">
          <label>Tên thương hiệu</label>
          <input
            name="footerLogo"
            value={form.footerLogo || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Mô tả</label>
          <input
            name="footerDescription"
            value={form.footerDescription || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Instagram</label>
          <input
            name="footerInstagram"
            value={form.footerInstagram || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Facebook</label>
          <input
            name="footerFacebook"
            value={form.footerFacebook || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>TikTok</label>
          <input
            name="footerTikTok"
            value={form.footerTikTok || ""}
            onChange={change}
          />
        </div>

        <div className="admin-field">
          <label>Copyright</label>
          <input
            name="footerCopyright"
            value={form.footerCopyright || ""}
            onChange={change}
          />
        </div>

        <button
          className="admin-btn primary"
          disabled={busy}
        >
          {busy ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}