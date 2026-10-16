import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

/* Đọc nội dung trang chủ từ Firestore (settings/home), tự cập nhật ngay khi admin lưu */
export default function useHomeContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.warn(
        "[home] Firebase chưa được cấu hình (thiếu biến môi trường VITE_FIREBASE_...)."
      );

      setContent({});
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "settings", "home"),
      (snap) => {
        if (snap.exists()) {
          setContent(snap.data());
        } else {
          console.info(
            "[home] Chưa có tài liệu settings/home, đang dùng nội dung mặc định."
          );

          setContent({});
        }

        setLoading(false);
      },
      (err) => {
        console.error(
          "[home] Không đọc được settings/home:",
          err.code,
          err.message
        );

        setContent({});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    ...content,
    loading,
  };
}