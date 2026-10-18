import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/* Đổi trang → lên đầu trang.
   Link có #hash (vd: /#about, /#shop, /#contact) → cuộn tới đúng mục đó,
   kể cả khi đang ở trang khác (trang chi tiết sản phẩm) hoặc đã ở trang chủ. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lastPath = useRef(null);

  useLayoutEffect(() => {
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;

    const id = decodeURIComponent((hash || "").replace(/^#/, ""));

    if (!id) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return undefined;
    }

    // Sang trang khác: nhảy thẳng tới mục; cùng trang: cuộn mượt
    const behavior = pathChanged ? "instant" : "smooth";
    const timers = [];
    const goTo = (b) => {
      const el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: b, block: "start" });
      return true;
    };

    if (!goTo(behavior)) {
      // Mục chưa kịp hiện (đang tải): thử lại vài lần
      [100, 300, 700].forEach((ms) =>
        timers.push(window.setTimeout(() => goTo("instant"), ms))
      );
    } else if (pathChanged) {
      // Ảnh/nội dung tải xong làm lệch vị trí → căn lại một lần
      timers.push(window.setTimeout(() => goTo("instant"), 600));
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [pathname, hash]);

  return null;
}

export default ScrollToTop;