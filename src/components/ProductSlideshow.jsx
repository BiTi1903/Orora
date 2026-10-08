import { useEffect, useState } from "react";

function clean(images) {
  return (images || []).map((src) => (src || "").trim()).filter(Boolean);
}

export default function ProductSlideshow({ images, alt = "" }) {
  const list = clean(images);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [list.join("|")]);

  useEffect(() => {
    if (list.length < 2 || paused) return undefined;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % list.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [list.length, paused, list.join("|")]);

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

      {list.length > 1 && (
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
