import {useLayoutEffect} from 'react';

export default function useChatEntrance(root, anchor, settings = {}, enabled = true) {
  const config = settings || {};
  const animate = config.chatPopupAnimation !== false;
  const duration = Math.max(200,Math.min(700,Number(config.chatPopupDuration)||420));
  useLayoutEffect(()=>{
    const node = root.current, source = anchor?.current;
    if (!enabled || !animate || !node || !source) return;
    const view = node.ownerDocument.defaultView;
    if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const from = source.getBoundingClientRect(), to = node.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const x = from.x+from.width/2-to.right;
    const y = from.y+from.height/2-to.bottom;
    const sx = Math.max(.05,Math.min(.4,from.width/to.width));
    const sy = Math.max(.05,Math.min(.4,from.height/to.height));
    const animation = node.animate([
      // Relative center offsets keep the origin anchored when webfonts change the form height.
      {transform:`translate(calc(50% + ${x}px),calc(50% + ${y}px)) scale(${sx},${sy})`,opacity:0},
      {transform:'translate(0,0) scale(1)',opacity:1},
    ],{duration,easing:'cubic-bezier(.16,1,.3,1)'});
    animation.id = 'orora-chat-entrance';
    return ()=>animation.cancel();
  },[root,anchor,animate,duration,enabled]);
}
