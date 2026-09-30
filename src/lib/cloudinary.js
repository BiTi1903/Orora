const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = Boolean(CLOUD && PRESET);

/* Tải ảnh lên Cloudinary, trả về link đã tự nén (f_auto, q_auto) và giới hạn chiều rộng */
export async function uploadImage(file, { width = 1200 } = {}) {
  if (!cloudinaryConfigured) throw new Error("Chưa cấu hình Cloudinary.");

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();

  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Tải ảnh lên không thành công.");
  }

  return data.secure_url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}