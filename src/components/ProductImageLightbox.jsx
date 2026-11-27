import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const viewRef = useRef(null);
  const imageRef = useRef(null);
  const anchor = useRef(null);
  const [fitWidth, setFitWidth] = useState(null);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const image = imageRef.current;
    function measure() {
      if (image.naturalWidth && image.naturalHeight) {
        setFitWidth(Math.min(view.clientWidth, view.clientHeight * image.naturalWidth / image.naturalHeight));
      }
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    image.addEventListener("load", measure);
    return () => { observer.disconnect(); image.removeEventListener("load", measure); };
  }, [currentSrc]);

  function changeZoom(value, point) {
    const next = clampZoom(value);
    if (next === zoom) return;
    const box = viewRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    const x = point?.x ?? box.left + box.width / 2;
    const y = point?.y ?? box.top + box.height / 2;
    anchor.current = { x, y, fx: (x-image.left)/image.width, fy: (y-image.top)/image.height };
    if (next >= 2) setLoadLarge(true);
    setZoom(next);
  }

  useLayoutEffect(() => {
    const target = anchor.current;
    if (!target) return;
    anchor.current = null;
    const image = imageRef.current.getBoundingClientRect();
    viewRef.current.scrollBy(image.left + target.fx * image.width - target.x, image.top + target.fy * image.height - target.y);
  }, [zoom]);

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
        changeZoom(zoom > 1 ? 1 : 2, {x:event.clientX,y:event.clientY});
      }
      gesture.current = null;
    }
  }

  return (
    <ModalDialog title={name} onClose={onClose} className="product-lightbox">
      {hasMultiple && (
        <div className="product-lightbox-nav-group">
          <button type="button" aria-label="Ảnh trước" onClick={() => stepImage(-1)}>‹</button>
          <button type="button" aria-label="Ảnh sau" onClick={() => stepImage(1)}>›</button>
        </div>
      )}
      <div
        ref={viewRef}
        className="product-lightbox-view"
        tabIndex={0}
        role="button"
        onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            changeZoom(zoom > 1 ? 1 : 2);
          }
        }}
        aria-label={zoom > 1 ? "Thu nhỏ ảnh" : "Phóng to ảnh"}
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
            const points = [...pointers.current.values()];
            changeZoom((pinch.current.zoom * distance(points)) / pinch.current.length, {x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
          }
        }}
        onPointerUp={release}
        onLostPointerCapture={event => {
          pointers.current.delete(event.pointerId);
          pinch.current = null;
          gesture.current = null;
        }}
      >
        <img
          ref={imageRef}
          src={cdnSrc(currentSrc, { w: loadLarge ? 2400 : 1600, q: "auto:best" })}
          alt={name}
          draggable={false}
          style={{ width: fitWidth ? fitWidth * zoom : "100%" }}
        />
      </div>
    </ModalDialog>
  );
}
