const FLAGS = ['header', 'chat', 'top', 'tabs', 'close', 'buttons', 'frames', 'rims'];
const bounded = (value, fallback, min, max) => {
  const number = Number(value ?? fallback);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
};

// Use the same finish in the storefront and the isolated builder preview.
export function applyGlassSurfaces(root, settings = {}) {
  for (const name of FLAGS) root.toggleAttribute(`data-glass-${name}`, settings[name] !== false);
  const rim = bounded(settings.rimOpacity, .8, 0, 1);
  const variables = {
    '--surface-rim-opacity': String(rim),
    '--surface-rim-strength': `${rim * 100}%`,
    '--surface-blur': `${bounded(settings.blur, 18, 0, 30)}px`,
    '--surface-frame-blur': `${bounded(settings.frameBlur, 6, 0, 10)}px`,
    '--surface-opacity': `${bounded(settings.opacity, 78, 45, 100)}%`,
  };
  for (const [key, value] of Object.entries(variables)) root.style.setProperty(key, value);
  return () => {
    for (const name of FLAGS) root.removeAttribute(`data-glass-${name}`);
    for (const key of Object.keys(variables)) root.style.removeProperty(key);
  };
}

export function watchGlassTabs(doc) {
  const viewport = doc.defaultView;
  let frame;
  const measure = () => {
    doc.querySelectorAll('.product-information-nav').forEach(nav => {
      const active = nav.querySelector('[aria-current="location"]');
      if (!active) return;
      for (const [key, value] of Object.entries({x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight})) {
        nav.style.setProperty(`--tab-${key}`, `${value}px`);
      }
    });
  };
  const update = () => {
    viewport.cancelAnimationFrame(frame);
    frame = viewport.requestAnimationFrame(measure);
  };
  const observer = new viewport.MutationObserver(update);
  observer.observe(doc.getElementById('root') || doc.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['aria-current']});
  viewport.addEventListener('resize', update);
  measure();
  return () => {
    observer.disconnect();
    viewport.cancelAnimationFrame(frame);
    viewport.removeEventListener('resize', update);
  };
}
