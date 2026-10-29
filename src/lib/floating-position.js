export function clampFloatingPosition(position, viewport, size, padding = 12) {
  const left = viewport.offsetLeft || 0;
  const top = viewport.offsetTop || 0;
  return {
    x: Math.min(Math.max(left + padding, position.x), Math.max(left + padding, left + viewport.width - size.width - padding)),
    y: Math.min(Math.max(top + padding, position.y), Math.max(top + padding, top + viewport.height - size.height - padding)),
  };
}
