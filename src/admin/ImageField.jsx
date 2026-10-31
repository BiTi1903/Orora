import { useEffect, useId, useRef, useState } from "react";
import { uploadImage, cloudinaryConfigured } from "../lib/cloudinary";

export default function ImageField({ label, value, onChange, width = 1200, disabled = false, onBusyChange }) {
  const id = useId();
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Vui lòng chọn file ảnh.");
    if (file.size > 10 * 1024 * 1024) return setError("Ảnh quá lớn (tối đa 10MB).");

    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    setBusy(true); onBusyChange?.(true);
    try {
      const url = await uploadImage(file, {
        width,
        signal: controller.signal,
        onProgress: setProgress,
      });
      onChange(url);
    } catch (err) {
      // Hủy chủ động thì không cần hiện lỗi
      if (!controller.signal.aborted) setError(err.message || "Tải ảnh lên không thành công.");
    } finally {
      // Luôn tắt trạng thái "đang tải", dù thành công, lỗi hay hủy
      abortRef.current = null;
      setBusy(false); onBusyChange?.(false);
      setProgress(0);
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
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
              disabled={disabled || busy || !cloudinaryConfigured}
            >
              {busy ? (progress > 0 && progress < 100 ? `Đang tải lên ${progress}%` : "Đang xử lý...") : "Tải ảnh lên"}
            </button>
            {busy && (
              <button type="button" className="admin-btn danger" onClick={cancel}>
                Hủy
              </button>
            )}
            {value && (
              <button type="button" className="admin-btn danger" disabled={disabled || busy} onClick={() => onChange("")}>
                Bỏ ảnh
              </button>
            )}
          </div>

          <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />

          <input
            id={id} disabled={disabled || busy}
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