import {responsiveImage} from "../lib/image-cdn";
import useVisiblePlayback from "../hooks/useVisiblePlayback";
import { useEffect, useRef, useState } from "react";

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
  sizes = "(max-width: 1000px) 45vw, 28vw",
}) {
  const list = clean(images);
  const root=useRef(null);
  const canPlay=useVisiblePlayback(root,autoPlay && list.length>1);
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

  // Warm just the next slide while visible. Keep previously used images attached
  // so crossfades/manual navigation reuse the browser cache without a load burst.
  const [loaded, setLoaded] = useState({key: imagesKey, sources: []});
  const needed = [list[index], ...(canPlay ? [list[(index + 1) % list.length]] : [])].filter(Boolean);
  const loadedSources = loaded.key === imagesKey ? loaded.sources : [];
  const sources = [...new Set([...loadedSources, ...needed])];
  if (loaded.key !== imagesKey || sources.length !== loadedSources.length) {
    setLoaded({key: imagesKey, sources});
  }

  const setIndex = (next) => {
    if (isControlled) onIndexChange(next);
    else setInternalIndex(next);
  };

  useEffect(() => {
    if (!canPlay || list.length < 2 || paused) return undefined;
    const id = window.setInterval(() => {
      const next = (index + 1) % list.length;
      if (isControlled) onIndexChange(next);
      else setInternalIndex(next);
    }, interval);
    return () => window.clearInterval(id);
  }, [canPlay, list.length, paused, imagesKey, index, interval, isControlled, onIndexChange]);

  if (!list.length) return null;

  return (
    <div
      className="product-slideshow"
      ref={root}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((src, i) => (
        <img
          key={`${src}-${i}`}
          {...(sources.includes(src) ? responsiveImage(src,{sizes}) : {})}
          loading="lazy"
          decoding="async"
          alt={i === index ? alt : ""}
          className={i === index ? "is-active" : ""}
          aria-hidden={i === index ? undefined : true}
        />
      ))}

      {showDots && list.length > 1 && (
        <div className="product-slideshow-dots" role="group" aria-label="Chọn ảnh sản phẩm">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? "is-active" : ""}
              aria-label={`Ảnh ${i + 1}`}
              aria-pressed={i === index}
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