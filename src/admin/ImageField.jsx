import { useRef, useState } from "react";
import { uploadImage, cloudinaryConfigured } from "../lib/cloudinary";

export default function ImageField({ label, value, onChange, width = 1200 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Vui lòng chọn file ảnh.");
    if (file.size > 10 * 1024 * 1024) return setError("Ảnh quá lớn (tối đa 10MB).");

    setBusy(true);
    try {
      onChange(await uploadImage(file, { width }));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-image">
        <div className="admin-image-preview">
          {value ? <img src={value} alt="" /> : <span>Chưa có ảnh</span>}
        </div>

        <div className="admin-image-side">
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn"
              onClick={() => inputRef.current?.click()}
              disabled={busy || !cloudinaryConfigured}
            >
              {busy ? "Đang tải lên..." : "Tải ảnh lên"}
            </button>
            {value && (
              <button type="button" className="admin-btn danger" onClick={() => onChange("")}>
                Bỏ ảnh
              </button>
            )}
          </div>

          <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />

          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hoặc dán link ảnh / đường dẫn /gallery1.jpg"
          />

          {!cloudinaryConfigured && (
            <p className="admin-muted" style={{ fontSize: 12 }}>
              Chưa cấu hình Cloudinary trong .env.local nên chưa tải ảnh lên được, bạn vẫn có thể dán link.
            </p>
          )}
          {error && <div className="admin-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}