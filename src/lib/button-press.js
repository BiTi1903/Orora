const bounded = (value, fallback, min, max) => {
  const number = Number(value ?? fallback);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
};

export function cancelButtonPress(button, id = 'orora-button-press') {
  button?.getAnimations().filter(animation => animation.id === id).forEach(animation => animation.cancel());
}

export function animateButtonPress(button, chat = false, previewSettings) {
  if (!button) return;
  const doc = button.ownerDocument, view = doc.defaultView;
  const id = chat ? 'orora-chat-press' : 'orora-button-press';
  const current = Number.parseFloat(view.getComputedStyle(button).scale) || 1;
  cancelButtonPress(button, id);
  const disabled = previewSettings ? previewSettings.pressFeedback === false : doc.documentElement.dataset.buttonPress === 'off';
  if (disabled || view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const css = view.getComputedStyle(doc.documentElement);
  const duration = bounded(previewSettings ? previewSettings.pressDuration : Number.parseFloat(css.getPropertyValue('--button-press-duration')), 240, 120, 500);
  const depth = bounded(previewSettings ? previewSettings.pressDepth : Number.parseFloat(css.getPropertyValue('--button-press-depth')), 4, 2, 10) / 100;
  // Individual scale leaves existing hover, drag and stretch transforms intact.
  const animation = button.animate([
    {scale:String(current),offset:0},
    {scale:String(1-depth*(chat?2:1)),offset:.2},
    {scale:chat?'1.04':'1.01',offset:.65},
    {scale:'1',offset:1},
  ], {duration:duration*(chat?1.5:1),easing:'cubic-bezier(.2,.75,.25,1)'});
  animation.id = id;
  return animation;
}

export function installButtonPressFeedback(doc, settings = {}) {
  const root = doc.documentElement;
  root.dataset.buttonPress = settings.pressFeedback === false ? 'off' : 'on';
  root.style.setProperty('--button-press-duration', String(bounded(settings.pressDuration,240,120,500)));
  root.style.setProperty('--button-press-depth', String(bounded(settings.pressDepth,4,2,10)));
  root.style.setProperty('--button-press-scale', String(1-bounded(settings.pressDepth,4,2,10)/100));
  const target = event => {
    const button = event.target?.closest?.('button,input[type="button"],input[type="submit"],input[type="reset"],[role="button"],a[class*="button"],a[class*="btn"],.product-contact-actions a,.orora-chat-channel-options a,.mobile-shop-nav a,.purchase-facebook,.purchase-tiktok');
    return button && !button.matches('.chat-button,.safari-nav-toggle,[data-press-preview],:disabled,[aria-disabled="true"]') && !button.closest('[inert],.is-dragging') ? button : null;
  };
  const press = event => { const button = target(event); if (button) animateButtonPress(button); };
  const cancel = event => cancelButtonPress(target(event));
  doc.addEventListener('click',press,{capture:true,passive:true});
  doc.addEventListener('pointerdown',cancel,{capture:true,passive:true});
  return () => {
    doc.removeEventListener('click',press,true);
    doc.removeEventListener('pointerdown',cancel,true);
    doc.getAnimations().filter(animation=>['orora-button-press','orora-chat-press'].includes(animation.id)).forEach(animation=>animation.cancel());
    delete root.dataset.buttonPress;
    ['--button-press-duration','--button-press-depth','--button-press-scale'].forEach(key=>root.style.removeProperty(key));
  };
}
