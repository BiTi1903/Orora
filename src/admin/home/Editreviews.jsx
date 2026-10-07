import useHomeForm from "./Usehomeform";
import { Field, SectionShell } from "./Ui";
import ImageField from "../ImageField";

export default function EditReviews() {
  const h = useHomeForm([
    "testimonialsLabel",
    "testimonialsTitle",
    "testimonialsHighlight",
    "testimonialsTitleEnd",
    "reviews",
  ]);

  const reviews = h.form.reviews || [];

  return (
    <SectionShell
      title="Cảm nhận khách hàng"
      hint="Chỉ đăng đánh giá thật của khách hàng. Có thể thêm ảnh nhỏ của khách."
      {...h}
      onSubmit={h.save}
    >
      <Field label="Nhãn nhỏ" name="testimonialsLabel" {...h} />
      <Field
        label="Tiêu đề (trước chữ nổi bật)"
        name="testimonialsTitle"
        {...h}
      />
      <Field
        label="Chữ nổi bật"
        name="testimonialsHighlight"
        {...h}
      />
      <Field
        label="Tiêu đề (phía sau)"
        name="testimonialsTitleEnd"
        {...h}
      />

      <div className="admin-list-block">
        {reviews.map((item, i) => (
          <div className="admin-sub" key={i}>
            <div className="admin-sub-head">
              <h3>Đánh giá {i + 1}</h3>
              <button
                type="button"
                className="admin-btn danger"
                onClick={() => h.removeItem("reviews", i)}
              >
                Xóa
              </button>
            </div>

            <div className="admin-field">
              <label>Tên khách hàng</label>
              <input
                value={item.name || ""}
                onChange={(e) =>
                  h.updateItem("reviews", i, "name", e.target.value)
                }
              />
            </div>

            <div className="admin-field">
              <label>Nội dung</label>
              <textarea
                rows={3}
                value={item.text || ""}
                onChange={(e) =>
                  h.updateItem("reviews", i, "text", e.target.value)
                }
              />
            </div>

            <ImageField
              label="Ảnh khách hàng (tròn, nhỏ)"
              value={item.image || ""}
              onChange={(v) => h.updateItem("reviews", i, "image", v)}
              width={200}
            />
          </div>
        ))}

        <button
          type="button"
          className="admin-btn"
          onClick={() =>
            h.addItem("reviews", { name: "", text: "", image: "" })
          }
        >
          + Thêm đánh giá
        </button>
      </div>
    </SectionShell>
  );
}