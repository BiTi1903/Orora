const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = Boolean(CLOUD && PRESET);

const UPLOAD_TIMEOUT_MS = 90_000; // quá 90s không xong → báo lỗi thay vì quay mãi
const MAX_SIDE = 2000; // thu nhỏ ảnh quá lớn trước khi tải lên (ảnh điện thoại thường 4000px+)
const SKIP_RESIZE_BYTES = 1.5 * 1024 * 1024;

/* Thu nhỏ ảnh ngay trên trình duyệt: file nhẹ hơn nhiều → tải lên nhanh, ít bị treo.
   Ảnh nhỏ sẵn, GIF, SVG hoặc lỗi khi xử lý → dùng nguyên file gốc. */
async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_SIDE && file.size <= SKIP_RESIZE_BYTES) {
      bitmap.close?.();
      return file;
    }

    const scale = Math.min(1, MAX_SIDE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    // PNG/WebP giữ nền trong suốt bằng WebP, ảnh JPEG giữ JPEG
    const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.92));
    if (!blob || blob.size >= file.size) return file;

    const ext = type === "image/jpeg" ? "jpg" : "webp";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type });
  } catch {
    return file;
  }
}

/* Tải ảnh lên Cloudinary, trả về link đã tự nén (f_auto, q_auto) và giới hạn chiều rộng.
   onProgress(0..100) báo tiến trình; signal (AbortController) để hủy giữa chừng. */
export async function uploadImage(file, { width = 1200, onProgress, signal } = {}) {
  if (!cloudinaryConfigured) throw new Error("Chưa cấu hình Cloudinary.");

  const body = new FormData();
  body.append("file", await shrinkImage(file));
  body.append("upload_preset", PRESET);

  const secureUrl = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* phản hồi không phải JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve(data.secure_url);
      } else {
        reject(new Error(data?.error?.message || `Tải ảnh lên không thành công (mã ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Mất kết nối khi tải ảnh. Kiểm tra mạng rồi thử lại."));
    xhr.ontimeout = () => reject(new Error("Tải ảnh quá lâu nên đã dừng. Thử lại hoặc dùng ảnh nhẹ hơn."));
    xhr.onabort = () => reject(new Error("Đã hủy tải ảnh."));

    if (signal) {
      if (signal.aborted) return reject(new Error("Đã hủy tải ảnh."));
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });

  return secureUrl.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}