export const POPUP_OPEN_EASING = 'cubic-bezier(.16,1,.3,1)';
// Time-reversed equivalent of Chat AI exit cubic-bezier(.4,0,.7,.4) for playbackRate = -1.
export const POPUP_CLOSE_EASING = 'cubic-bezier(.3,.6,.6,1)';

export function popupCloseDuration(openDuration = 420) {
  return Math.max(120, Math.min(380, (Number(openDuration) || 420) * .65));
}

export function popupMotionKeyframes(source, box) {
  const x = source.x + (source.width || 0) / 2 - box.left - box.width / 2;
  const y = source.y + (source.height || 0) / 2 - box.top - box.height / 2;
  const sx = box.width ? Math.max(.05, Math.min(.4, (source.width || 0) / box.width)) : .12;
  const sy = box.height ? Math.max(.05, Math.min(.4, (source.height || 0) / box.height)) : .12;
  return [
    { transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`, opacity: 0 },
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  ];
}
