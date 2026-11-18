import {useLayoutEffect} from 'react';

function popupFrame(node, source) {
  const from = source.getBoundingClientRect(), to = node.getBoundingClientRect();
  if (!to.width || !to.height) return null;
  const x = from.x + from.width / 2 - to.right;
  const y = from.y + from.height / 2 - to.bottom;
  const sx = Math.max(.05, Math.min(.4, from.width / to.width));
  const sy = Math.max(.05, Math.min(.4, from.height / to.height));
  return { transform: `translate(calc(50% + ${x}px),calc(50% + ${y}px)) scale(${sx},${sy})`, opacity: 0 };
}

export function animateChatExit(node, source, settings) {
  if (!node || !source || settings?.chatPopupAnimation === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const style = getComputedStyle(node);
  const start = { transform: style.transform, opacity: style.opacity };
  // Capture the painted frame before removing an unfinished opening animation.
  node.getAnimations().filter(animation => animation.id === 'orora-chat-entrance').forEach(animation => animation.cancel());
  const end = popupFrame(node, source);
  if (!end) return null;
  const duration = Math.max(120, Math.min(380, (Number(settings?.chatPopupDuration) || 420) * .65));
  const animation = node.animate([start, end], { duration, easing: 'cubic-bezier(.4,0,.7,.4)', fill: 'forwards' });
  animation.id = 'orora-chat-exit';
  return animation;
}

export default function useChatEntrance(root, anchor, settings = {}, enabled = true) {
  const config = settings || {};
  const animate = config.chatPopupAnimation !== false;
  const duration = Math.max(200,Math.min(700,Number(config.chatPopupDuration)||420));
  useLayoutEffect(()=>{
    const node = root.current, source = anchor?.current;
    if (!enabled || !animate || !node || !source) return;
    const view = node.ownerDocument.defaultView;
    if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = popupFrame(node, source);
    if (!start) return;
    const animation = node.animate([
      start,
      {transform:'translate(0,0) scale(1)',opacity:1},
    ],{duration,easing:'cubic-bezier(.16,1,.3,1)'});
    animation.id = 'orora-chat-entrance';
    return ()=>animation.cancel();
  },[root,anchor,animate,duration,enabled]);
}
