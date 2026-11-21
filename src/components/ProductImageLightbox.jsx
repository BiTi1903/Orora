import { useEffect, useRef, useState } from "react";
import ModalDialog from "./ModalDialog";
import { cdnSrc } from "../lib/image-cdn";

const distance = ([first, second]) => Math.hypot(first.x - second.x, first.y - second.y);
const clampZoom = (value) => Math.min(4, Math.max(1, value));

export default function ProductImageLightbox({ src, images, initialIndex = 0, name, onClose }) {
  const gallery = Array.isArray(images) && images.length ? images : src ? [src] : [];
  const [index, setIndex] = useState(() => Math.max(0, Math.min(gallery.length - 1, initialIndex)));
  const [zoom, setZoom] = useState(1);
  const [loadLarge, setLoadLarge] = useState(false);
  const currentSrc = gallery[index] || src;
  const hasMultiple = gallery.length > 1;

  function changeZoom(value) {
    const next = clampZoom(value);
    if (next >= 2) setLoadLarge(true);
    setZoom(next);
  }

  const stepImage = (delta) => {
    if (!hasMultiple) return;
    setIndex((current) => (current + delta + gallery.length) % gallery.length);
    setZoom(1);
  };

  useEffect(() => {
    if (!hasMultiple) return;
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + gallery.length) % gallery.length);
        setZoom(1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % gallery.length);
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasMultiple, gallery.length]);

  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const gesture = useRef(null);

  function release(event) {
    const start = gesture.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0 && start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (zoom === 1 && hasMultiple && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        stepImage(dx < 0 ? 1 : -1);
      } else if (!start.moved && Math.hypot(dx, dy) < 8) {
        changeZoom(zoom > 1 ? 1 : 2);
      }
      gesture.current = null;
    }
  }

  return (
    <ModalDialog title={name} onClose={onClose} className="product-lightbox">
      <div className="product-lightbox-bar">
        <div className="product-lightbox-tools" aria-label="Điều khiển phóng to">
          <button type="button" aria-label="Thu nhỏ" disabled={zoom <= 1} onClick={() => changeZoom(zoom - 0.5)}>
            −
          </button>
          <button type="button" className="product-lightbox-zoom-level" disabled={zoom === 1} onClick={() => setZoom(1)}>
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" aria-label="Phóng to" disabled={zoom >= 4} onClick={() => changeZoom(zoom + 0.5)}>
            +
          </button>
        </div>
        {hasMultiple && (
          <div className="product-lightbox-nav-group">
            <button type="button" aria-label="Ảnh trước" onClick={() => stepImage(-1)}>‹</button>
            <span className="product-lightbox-counter">{index + 1} / {gallery.length}</span>
            <button type="button" aria-label="Ảnh sau" onClick={() => stepImage(1)}>›</button>
          </div>
        )}
      </div>
      <div
        className="product-lightbox-view"
        tabIndex={0}
        role="region"
        aria-label="Ảnh sản phẩm phóng to"
        data-zoomed={zoom > 1}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch" && event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 1) {
            gesture.current = { x: event.clientX, y: event.clientY, moved: false };
          } else if (pointers.current.size === 2) {
            gesture.current = null;
            pinch.current = { length: distance([...pointers.current.values()]), zoom };
          }
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          const previous = pointers.current.get(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (gesture.current && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 8) {
            gesture.current.moved = true;
          }
          if (pointers.current.size === 1 && zoom > 1) {
            event.currentTarget.scrollBy(previous.x - event.clientX, previous.y - event.clientY);
          }
          if (pinch.current?.length && pointers.current.size === 2) {
            changeZoom((pinch.current.zoom * distance([...pointers.current.values()])) / pinch.current.length);
          }
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <img
          src={cdnSrc(currentSrc, { w: loadLarge ? 2400 : 1600, q: "auto:best" })}
          alt={name}
          draggable={false}
          style={{ width: `${zoom * 100}%` }}
        />
      </div>
      <p className="product-lightbox-hint">
        {zoom > 1 ? "Kéo để xem chi tiết · Chạm ảnh để thu về 100%" : `Chạm ảnh để phóng to${hasMultiple ? " · Vuốt hoặc dùng phím ← → đổi ảnh" : ""}`}
      </p>
    </ModalDialog>
  );
}
