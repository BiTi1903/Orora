import { useEffect, useState } from "react";

function clean(images) {
  return (images || []).map((src) => (src || "").trim()).filter(Boolean);
}

/**
 * Slideshow ảnh sản phẩm (tự xoay như collection).
 * - controlled: truyền activeIndex + onIndexChange
 * - uncontrolled: tự xoay mỗi 3s
 */
export default function ProductSlideshow({
  images,
  alt = "",
  activeIndex: controlledIndex,
  onIndexChange,
  interval = 3000,
  showDots = true,
  autoPlay = true,
}) {
  const list = clean(images);
  const isControlled = controlledIndex != null && typeof onIndexChange === "function";
  const imagesKey = JSON.stringify(list);
  const [previousImagesKey, setPreviousImagesKey] = useState(imagesKey);
  const [internalIndex, setInternalIndex] = useState(0);
  if (previousImagesKey !== imagesKey) {
    setPreviousImagesKey(imagesKey);
    setInternalIndex(0);
  }
  const [paused, setPaused] = useState(false);

  const index = isControlled
    ? Math.min(Math.max(0, controlledIndex), Math.max(0, list.length - 1))
    : internalIndex;

  const setIndex = (next) => {
    if (isControlled) onIndexChange(next);
    else setInternalIndex(next);
  };

  useEffect(() => {
    if (!autoPlay || list.length < 2 || paused) return undefined;
    const id = window.setInterval(() => {
      const next = (index + 1) % list.length;
      if (isControlled) onIndexChange(next);
      else setInternalIndex(next);
    }, interval);
    return () => window.clearInterval(id);
  }, [autoPlay, list.length, paused, imagesKey, index, interval, isControlled, onIndexChange]);

  if (!list.length) return null;

  return (
    <div
      className="product-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === index ? alt : ""}
          className={i === index ? "is-active" : ""}
          aria-hidden={i === index ? undefined : true}
        />
      ))}

      {showDots && list.length > 1 && (
        <div className="product-slideshow-dots" aria-hidden="true">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? "is-active" : ""}
              aria-label={`Ảnh ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIndex(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}