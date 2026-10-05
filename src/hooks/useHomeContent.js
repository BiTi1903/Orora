import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { defaultHomeContent } from "../data/content";

/* Đọc nội dung trang chủ từ Firestore (settings/home), tự cập nhật ngay khi admin lưu */
export default function useHomeContent() {
  const [content, setContent] = useState(defaultHomeContent);

  useEffect(() => {
    if (!db) {
      console.warn("[home] Firebase chưa được cấu hình (thiếu biến môi trường VITE_FIREBASE_...).");
      return;
    }

    return onSnapshot(
      doc(db, "settings", "home"),
      (snap) => {
        if (snap.exists()) setContent({ ...defaultHomeContent, ...snap.data() });
        else console.info("[home] Chưa có tài liệu settings/home, đang dùng nội dung mặc định.");
      },
      (err) => console.error("[home] Không đọc được settings/home:", err.code, err.message)
    );
  }, []);

  return content;
}